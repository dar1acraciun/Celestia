"""
Pipeline complet: Imagine → Detecție stele → Graf → Predicție constelație.

Usage:
  python run_pipeline.py casiopea.jpg
  python run_pipeline.py casiopea.jpg --model model/best_constellation_gine.pt --top 5
  python run_pipeline.py                  # te întreabă calea la tastatură

Combină:
  1. Computer Vision (copVis.py)  → detectează stele, construiește graf
  2. Predicție (predict.py)       → încarcă modelul GNN, prezice constelația
"""

import os
import sys
import io
import argparse

# Fix Romanian characters on Windows console (cp1252 → utf-8)
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf8'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
import math
import numpy as np
import cv2
import matplotlib.pyplot as plt
from scipy.spatial import Delaunay

import torch
import torch.nn.functional as F

# Adăugăm directorul 'model/' în sys.path ca să putem importa din train_gcn
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(SCRIPT_DIR, "model")
sys.path.insert(0, MODEL_DIR)

from train_gcnv2 import (
    compute_invariant_features,
    ConstellationGINE,
    CONSTELLATION_NAMES,
    HIDDEN_DIM,
    EDGE_DIM,
    DROPOUT,
)

# train_gcn.py setează matplotlib backend la "Agg" (non-GUI).
# Îl resetăm la TkAgg pentru a putea afișa figuri interactiv.
import matplotlib
matplotlib.use("TkAgg")

# ═══════════════════════════════════════════════════════════════
# Parametri Computer Vision (identici cu copVis.py)
# ═══════════════════════════════════════════════════════════════
SKY_FRACTION = 0.97
BORDER_MARGIN = 20
GAUSSIAN_KERNEL = (5, 5)
LOCAL_MAX_KERNEL = 11
THRESH_STD_FACTOR = 4.0
MIN_ABS_THRESHOLD = 80
MIN_DIST = 14
N_STARS = 10
MAX_EDGE_LEN = 260
FOV_DEG = 60


# ═══════════════════════════════════════════════════════════════
# Funcții Computer Vision (din copVis.py)
# ═══════════════════════════════════════════════════════════════

def pixels_to_sphere(stars_px, img_shape, fov_deg=60):
    """Convertește coordonate pixel → coordonate 3D pe sfera unitară."""
    h_img, w_img = img_shape[:2]
    cx, cy = w_img / 2, h_img / 2
    scale = math.tan(math.radians(fov_deg / 2)) / (max(w_img, h_img) / 2)

    coords_3d = []
    for px, py in stars_px:
        tx = (px - cx) * scale
        ty = -(py - cy) * scale

        rho = math.sqrt(tx**2 + ty**2)
        c = math.atan(rho)

        if rho < 1e-10:
            lat, lon = 0.0, 0.0
        else:
            lat = math.asin(ty * math.sin(c) / rho)
            lon = math.atan2(tx * math.sin(c), rho * math.cos(c))

        x = math.cos(lat) * math.cos(lon)
        y = math.cos(lat) * math.sin(lon)
        z = math.sin(lat)
        coords_3d.append([x, y, z])

    return np.array(coords_3d, dtype=np.float32)


def build_delaunay_graph(points, max_edge_len=None):
    """
    Construiește graf Delaunay și elimină outlier-ii.
    Dacă max_edge_len=None, calculează automat un threshold adaptiv
    bazat pe distribuția distanțelor (median + 2×IQR).
    """
    n = len(points)
    if n < 2:
        return []
    if n == 2:
        return [(0, 1)]

    edges = set()
    tri = Delaunay(points)
    for simplex in tri.simplices:
        a, b, c = simplex
        edges.add(tuple(sorted((a, b))))
        edges.add(tuple(sorted((b, c))))
        edges.add(tuple(sorted((a, c))))

    # Calculăm distanțele tuturor muchiilor Delaunay
    edge_list = list(edges)
    dists = np.array([np.linalg.norm(points[i] - points[j]) for i, j in edge_list])

    # Threshold adaptiv dacă nu e specificat
    if max_edge_len is None:
        q25, q50, q75 = np.percentile(dists, [25, 50, 75])
        iqr = q75 - q25
        max_edge_len = q50 + 2.0 * iqr  # median + 2×IQR
        print(f"  MAX_EDGE_LEN adaptiv: {max_edge_len:.1f} px  (median={q50:.1f}, IQR={iqr:.1f})")

    filtered_edges = []
    for (i, j), d in zip(edge_list, dists):
        if d <= max_edge_len:
            filtered_edges.append((i, j))

    return filtered_edges
def centroid_refinement(gray_img, xs, ys, patch_radius=3):
    """Rafinare poziție stea prin centroid luminos local."""
    refined = []
    h, w = gray_img.shape

    for x, y in zip(xs, ys):
        x0 = max(0, x - patch_radius)
        x1 = min(w, x + patch_radius + 1)
        y0 = max(0, y - patch_radius)
        y1 = min(h, y + patch_radius + 1)

        patch = gray_img[y0:y1, x0:x1].astype(np.float32)
        if patch.size == 0 or patch.sum() <= 0:
            refined.append((x, y, gray_img[y, x]))
            continue

        yy, xx = np.mgrid[y0:y1, x0:x1]
        total = patch.sum()

        cx = (xx * patch).sum() / total
        cy = (yy * patch).sum() / total
        brightness = gray_img[y, x]

        refined.append((cx, cy, brightness))

    return refined


def detect_stars(image_path, n_stars=N_STARS):
    """
    Detectează stele dintr-o imagine și returnează:
      - stars: [N, 2] coordonate pixel
      - brightness_vals: [N] luminozități
      - edges: lista de muchii (i, j)
      - img: imaginea originală BGR
      - gray: imaginea grayscale
    """
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Nu am găsit imaginea: {image_path}")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    h, w = gray.shape

    # Mască cer
    sky_mask = np.zeros_like(gray, dtype=np.uint8)
    sky_mask[
        BORDER_MARGIN:int(h * SKY_FRACTION),
        BORDER_MARGIN:w - BORDER_MARGIN
    ] = 255

    # Blur + local maxima
    blurred = cv2.GaussianBlur(gray, GAUSSIAN_KERNEL, 0)
    kernel = np.ones((LOCAL_MAX_KERNEL, LOCAL_MAX_KERNEL), dtype=np.uint8)
    dilated = cv2.dilate(blurred, kernel)
    local_max = (blurred == dilated)

    # Threshold adaptiv
    sky_pixels = blurred[sky_mask > 0]
    sky_mean = np.mean(sky_pixels)
    sky_std = np.std(sky_pixels)
    brightness_threshold = max(sky_mean + THRESH_STD_FACTOR * sky_std, MIN_ABS_THRESHOLD)
    bright_mask = blurred >= brightness_threshold

    # Candidate stars
    star_mask = local_max & bright_mask & (sky_mask > 0)
    ys, xs = np.where(star_mask)

    if len(xs) == 0:
        raise RuntimeError("Nu s-au detectat stele. Încearcă un threshold mai mic.")

    # Centroid refinement
    refined = centroid_refinement(gray, xs, ys, patch_radius=3)
    xs = np.array([r[0] for r in refined], dtype=np.float32)
    ys = np.array([r[1] for r in refined], dtype=np.float32)
    star_brightness = np.array([r[2] for r in refined], dtype=np.float32)

    # Non-Maximum Suppression
    order = np.argsort(-star_brightness)
    kept = []

    for idx in order:
        x, y = xs[idx], ys[idx]
        b = star_brightness[idx]

        too_close = False
        for kx, ky, _ in kept:
            if (x - kx) ** 2 + (y - ky) ** 2 < MIN_DIST ** 2:
                too_close = True
                break

        if not too_close:
            kept.append((x, y, b))

    if len(kept) == 0:
        raise RuntimeError("Toate detecțiile au fost eliminate la NMS.")

    stars = np.array([[s[0], s[1]] for s in kept], dtype=np.float32)
    brightness_vals = np.array([s[2] for s in kept], dtype=np.float32)

    print(f"  Threshold adaptiv: {brightness_threshold:.2f}")
    print(f"  Stele detectate după NMS: {len(stars)}")

    # Selectăm cele mai luminoase N
    n_select = min(n_stars, len(stars))
    idx = np.argsort(brightness_vals)[::-1][:n_select]
    stars = stars[idx]
    brightness_vals = brightness_vals[idx]

    print(f"  Stele selectate (top {n_select}): {brightness_vals.astype(int)}")

    # Construim graful Delaunay (threshold adaptiv)
    edges = build_delaunay_graph(stars)  # max_edge_len calculat automat
    print(f"  Muchii după Delaunay + filtrare: {len(edges)}")

    return stars, brightness_vals, edges, img, gray


def build_pyg_graph(stars, brightness_vals, edges, img_shape, fov_deg=FOV_DEG):
    """
    Construiește un obiect PyG Data din detecțiile computer vision.
    """
    h, w = img_shape[:2]

    # Coordonate 3D pe sferă
    coords_3d = pixels_to_sphere(stars, (h, w), fov_deg=fov_deg)

    # Remapăm luminozitatea pixel → intervalul de antrenament [0.50, 0.84]
    # La antrenare: b = (6.0 - magnitudine) / 7.0  → interval 0.50–0.84 pentru stele tipice
    # La inferență: pixel/255 dă valori ~0.95–1.00 (în afara distribuției!)
    bmin, bmax = brightness_vals.min(), brightness_vals.max()
    if bmax > bmin:
        bright_norm = (0.50 + (brightness_vals - bmin) / (bmax - bmin) * 0.34).astype(np.float32)
    else:
        bright_norm = np.full(len(brightness_vals), 0.70, dtype=np.float32)
    print(f"  Brightness remap: pixel [{int(bmin)}-{int(bmax)}] → [{bright_norm.min():.2f}-{bright_norm.max():.2f}]")

    node_features = np.column_stack([coords_3d, bright_norm]).astype(np.float32)

    # Edge index
    if edges:
        src = np.array([e[0] for e in edges] + [e[1] for e in edges], dtype=np.int64)
        dst = np.array([e[1] for e in edges] + [e[0] for e in edges], dtype=np.int64)
        edge_index = np.stack([src, dst])
    else:
        edge_index = np.zeros((2, 0), dtype=np.int64)

    from torch_geometric.data import Data
    x = torch.tensor(node_features, dtype=torch.float)
    ei = torch.tensor(edge_index, dtype=torch.long)

    return Data(x=x, edge_index=ei)


def visualize_detection(img, stars, edges, brightness_vals, prediction=None):
    """Vizualizează detecția cu predicția."""
    fig, ax = plt.subplots(figsize=(10, 14))
    ax.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

    # Muchiile Delaunay
    for i, j in edges:
        x = [stars[i][0], stars[j][0]]
        y = [stars[i][1], stars[j][1]]
        ax.plot(x, y, color="yellow", linewidth=1.0, alpha=0.5, zorder=2)

    # Stelele detectate
    sizes = (brightness_vals / brightness_vals.max()) * 180 + 40
    ax.scatter(
        stars[:, 0], stars[:, 1],
        c="yellow", s=sizes,
        edgecolors="white", linewidths=1.0,
        zorder=6, alpha=0.95
    )

    for k, (sx, sy) in enumerate(stars):
        ax.text(sx + 6, sy - 6, str(k), color="lime", fontsize=10, fontweight="bold", zorder=7)

    title = f"Stars={len(stars)}, Edges={len(edges)}"
    if prediction:
        name, prob = prediction
        title += f"  |  {name} ({prob*100:.1f}%)"

    ax.set_title(title, fontsize=14)
    ax.axis("off")
    plt.tight_layout()
    plt.show()


# ═══════════════════════════════════════════════════════════════
# Predicție GNN
# ═══════════════════════════════════════════════════════════════

def predict_constellation(graph, model_path, top_k=5, device="cpu", return_top=False):
    """Rulează modelul GNN pe un graf PyG și returnează predicția."""

    # Feature engineering
    print("\n[3/3] Calculez features invariante + predicție GNN...")
    graph = compute_invariant_features(graph)
    in_channels = graph.x.shape[1]

    num_classes = len(CONSTELLATION_NAMES)

    model = ConstellationGINE(
        in_channels=in_channels,
        hidden_channels=HIDDEN_DIM,
        num_classes=num_classes,
        num_layers=4,
        dropout=DROPOUT,
        edge_dim=EDGE_DIM,
    )
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()
    model.to(device)

    graph = graph.to(device)
    batch = torch.zeros(graph.x.size(0), dtype=torch.long, device=device)

    with torch.no_grad():
        logits = model(graph.x, graph.edge_index, graph.edge_attr, batch)
        probs = F.softmax(logits, dim=1).squeeze()

    top_probs, top_indices = torch.topk(probs, min(top_k, num_classes))

    print(f"\n{'='*60}")
    print(f"  REZULTAT PREDICȚIE")
    print(f"{'='*60}")
    print(f"\n  Top {top_k} constelații posibile:\n")
    for i, (prob, idx) in enumerate(zip(top_probs, top_indices)):
        name = CONSTELLATION_NAMES[idx.item()]
        bar = "█" * int(prob.item() * 40)
        marker = " ◄── BEST" if i == 0 else ""
        print(f"  {i+1}. {name:<25} {prob.item()*100:6.2f}%  {bar}{marker}")

    best_idx = top_indices[0].item()
    best_name = CONSTELLATION_NAMES[best_idx]
    best_prob = top_probs[0].item()
    print(f"\n  Constelație prezisă: {best_name} ({best_prob*100:.1f}% confidence)")
    print(f"{'='*60}")

    if return_top:
        top5 = [(CONSTELLATION_NAMES[idx.item()], prob.item())
                for idx, prob in zip(top_indices, top_probs)]
        return best_name, best_prob, top5

    return best_name, best_prob


# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Pipeline complet: Imagine → Stele → Graf → Predicție constelație"
    )
    parser.add_argument("image", nargs="?", default=None,
                        help="Calea către imagine (sau o introduci de la tastatură)")
    parser.add_argument("--model", default=os.path.join(MODEL_DIR, "best_constellation_gine (6).pt"),
                        help="Calea către modelul antrenat .pt")
    parser.add_argument("--top", type=int, default=5,
                        help="Câte predicții top să afișeze")
    parser.add_argument("--device", default="cpu",
                        help="Device (cpu/cuda)")
    parser.add_argument("--no-viz", action="store_true",
                        help="Dezactivează vizualizarea matplotlib")
    parser.add_argument("--save-graph", action="store_true",
                        help="Salvează și fișierul .npz intermediar")
    parser.add_argument("--n-stars", type=int, default=N_STARS,
                        help=f"Câte stele să selecteze (implicit {N_STARS}). "
                             "Setează la numărul de stele din constelația țintă.")
    parser.add_argument("--fov", type=float, default=FOV_DEG,
                        help=f"Câmpul vizual al camerei în grade (implicit {FOV_DEG}). "
                             "Încearcă 40-90 pentru a potrivi camera ta.")
    args = parser.parse_args()

    # Calea imaginii
    image_path = args.image
    if not image_path:
        image_path = input("Introdu calea către imagine: ").strip()

    if not os.path.exists(image_path):
        print(f"Eroare: Nu am găsit imaginea: {image_path}")
        sys.exit(1)

    if not os.path.exists(args.model):
        print(f"Eroare: Nu am găsit modelul: {args.model}")
        print(f"Asigură-te că ai modelul antrenat (best_constellation_gine.pt) în directorul model/")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f"  PIPELINE: {os.path.basename(image_path)}")
    print(f"{'='*60}")

    # Pas 1: Detecție stele
    print(f"\n[1/3] Detectez stele din: {image_path}")
    stars, brightness_vals, edges, img, gray = detect_stars(image_path, n_stars=args.n_stars)

    # Pas 2: Construire graf PyG
    print(f"\n[2/3] Construiesc graful PyG... (FOV={args.fov}°)")
    graph = build_pyg_graph(stars, brightness_vals, edges, img.shape, fov_deg=args.fov)
    print(f"  Noduri: {graph.x.shape[0]}, Features: {graph.x.shape[1]}")
    print(f"  Muchii (bidirecționale): {graph.edge_index.shape[1]}")

    # Diagnostics: angular distances between all star pairs
    import torch as _torch
    coords = graph.x[:, :3]
    n = coords.shape[0]
    ang_dists = []
    for _i in range(n):
        for _j in range(_i + 1, n):
            dot = _torch.dot(coords[_i], coords[_j]).clamp(-1, 1)
            ang_dists.append(math.degrees(math.acos(dot.item())))
    if ang_dists:
        print(f"  Distanțe unghiulare între stele: min={min(ang_dists):.1f}°  max={max(ang_dists):.1f}°  medie={sum(ang_dists)/len(ang_dists):.1f}°")
        print(f"  (Training Orion: ~2°-20°, dacă max>30° încearcă --fov mai mic)")

    # Pas 3: Predicție
    best_name, best_prob = predict_constellation(
        graph, args.model, top_k=args.top, device=args.device
    )

    # Vizualizare
    if not args.no_viz:
        visualize_detection(img, stars, edges, brightness_vals,
                            prediction=(best_name, best_prob))

    # Salvare opțională .npz
    if args.save_graph:
        save_dir = "detected_computer_vision"
        os.makedirs(save_dir, exist_ok=True)
        save_name = os.path.splitext(os.path.basename(image_path))[0]
        save_path = os.path.join(save_dir, f"detected_{save_name}.npz")

        coords_3d = pixels_to_sphere(stars, img.shape[:2], fov_deg=FOV_DEG)
        bright_norm = (brightness_vals / 255.0).astype(np.float32)
        node_features = np.column_stack([coords_3d, bright_norm]).astype(np.float32)

        if edges:
            src = np.array([e[0] for e in edges] + [e[1] for e in edges], dtype=np.int64)
            dst = np.array([e[1] for e in edges] + [e[0] for e in edges], dtype=np.int64)
            edge_index = np.stack([src, dst])
        else:
            edge_index = np.zeros((2, 0), dtype=np.int64)

        np.savez(save_path, node_features=node_features,
                 edge_index=edge_index, stars_px=stars)
        print(f"\nGraf salvat și în: {save_path}")
