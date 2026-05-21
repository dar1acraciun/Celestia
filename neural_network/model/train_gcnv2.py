"""
Train a Graph Neural Network (GINE) for constellation classification.

Pipeline:
  1. pipeline_all_official_graphs.py  -> generează official_graphs/*.pt (88 constelații)
  2. augment_data.py                  -> generează dataset_augmented.pt (88 * N grafuri)
  3. train_gcn.py (ACEST FIȘIER)      -> antrenează un GINE pe grafurile augmentate

Îmbunătățiri față de versiunea anterioară:
  - 20 features INVARIANTE LA ROTAȚIE
    (+ clustering coeff, eccentricitate, closeness centrality, spectral eigenvalue)
  - Edge features (distanța unghiulară între stele conectate)
  - GINEConv (GIN cu edge features) + skip connections reziduale
  - Focal Loss pentru focus pe clasele dificile
  - Hidden dim 256, dropout redus 0.15
  - LR warmup + cosine decay
"""

import os
import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.data import Data
from torch_geometric.loader import DataLoader
from torch_geometric.nn import GINEConv, global_mean_pool, global_max_pool, global_add_pool, BatchNorm
import numpy as np
from collections import defaultdict, Counter, deque
import random
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


# ──────────────────────────── CONFIG ────────────────────────────
DATASET_PATH      = "/kaggle/input/datasets/dariacraciun/field-stars/dataset_field_stars.pt"
LABEL_MAP_PATH    = "/kaggle/input/datasets/dariacraciun/official-graphs/label_map_official.pt"
SAVE_MODEL_PATH   = "best_constellation_gine.pt"
HIDDEN_DIM        = 256
NUM_EPOCHS        = 400
LEARNING_RATE     = 3e-3
WEIGHT_DECAY      = 5e-4
BATCH_SIZE        = 64
DROPOUT           = 0.15
PATIENCE          = 60
LABEL_SMOOTHING   = 0.05
FOCAL_GAMMA       = 2.0
WARMUP_EPOCHS     = 10
EDGE_DIM          = 1       # 1 feature pe muchie (distanța unghiulară)
DEVICE            = torch.device("cuda" if torch.cuda.is_available() else "cpu")

CONSTELLATION_NAMES = [
    "Andromeda", "Antlia", "Apus", "Aquarius", "Aquila", "Ara", "Aries", "Auriga",
    "Bootes", "Caelum", "Camelopardalis", "Cancer", "Canes Venatici", "Canis Major",
    "Canis Minor", "Capricornus", "Carina", "Cassiopeia", "Centaurus", "Cepheus",
    "Cetus", "Chamaeleon", "Circinus", "Columba", "Coma Berenices", "Corona Australis",
    "Corona Borealis", "Corvus", "Crater", "Crux", "Cygnus", "Delphinus", "Dorado",
    "Draco", "Equuleus", "Eridanus", "Fornax", "Gemini", "Grus", "Hercules",
    "Horologium", "Hydra", "Hydrus", "Indus", "Lacerta", "Leo", "Leo Minor",
    "Lepus", "Libra", "Lupus", "Lynx", "Lyra", "Mensa", "Microscopium", "Monoceros",
    "Musca", "Norma", "Octans", "Ophiuchus", "Orion", "Pavo", "Pegasus", "Perseus",
    "Phoenix", "Pictor", "Piscis Austrinus", "Pisces", "Puppis", "Pyxis", "Reticulum",
    "Sagitta", "Sagittarius", "Scorpius", "Sculptor", "Scutum", "Serpens", "Sextans",
    "Taurus", "Telescopium", "Triangulum", "Triangulum Australe", "Tucana",
    "Ursa Major", "Ursa Minor", "Vela", "Virgo", "Volans", "Vulpecula"
]


# ═══════════════════════ FEATURE ENGINEERING ════════════════════

def compute_invariant_features(data):
    """
    Calculează 20 features invariante la rotație per nod + edge features.

    Per-nod:
      0)  brightness
      1)  degree / max_degree (normalizat)
      2)  degree / 10 (absolut)
      3)  distanța unghiulară medie la vecini
      4)  distanța minimă la vecini
      5)  distanța maximă la vecini
      6)  varianța distanțelor la vecini
      7)  unghiul mediu între perechi de muchii incidente
      8)  clustering coefficient
      9)  eccentricitate normalizată (/ diametru)
      10) closeness centrality
      11) degree / avg_degree

    Global (identice pt toate nodurile din graf):
      12) nr. noduri / 30
      13) nr. muchii / 60
      14) brightness medie
      15) brightness std
      16) brightness max
      17) densitatea grafului
      18) diametru / nr. noduri
      19) top eigenvalue adj / nr. noduri (spectral)

    Edge features:
      - distanța unghiulară normalizată (/ π)
    """
    coords = data.x[:, :3]      # [N, 3] coordonate carteziene pe sferă
    brightness = data.x[:, 3:4] # [N, 1]
    edge_index = data.edge_index
    num_nodes = coords.size(0)
    num_edges_undirected = edge_index.size(1) // 2

    # ── Adjacency list ──
    neighbors = defaultdict(list)
    if edge_index.size(1) > 0:
        for i in range(edge_index.size(1)):
            src, dst = edge_index[0, i].item(), edge_index[1, i].item()
            neighbors[src].append(dst)

    # ── Degree ──
    degree = torch.zeros(num_nodes)
    for node in range(num_nodes):
        degree[node] = len(neighbors[node])
    max_deg = degree.max().clamp(min=1)
    avg_deg = degree.mean().clamp(min=0.01)
    degree_norm  = (degree / max_deg).unsqueeze(1)
    degree_abs   = (degree / 10.0).unsqueeze(1)
    degree_ratio = (degree / avg_deg).unsqueeze(1)

    # ── Distanțe unghiulare + unghiuri între vecini ──
    mean_dist  = torch.zeros(num_nodes, 1)
    min_dist   = torch.zeros(num_nodes, 1)
    max_dist   = torch.zeros(num_nodes, 1)
    var_dist   = torch.zeros(num_nodes, 1)
    mean_angle = torch.zeros(num_nodes, 1)

    for node in range(num_nodes):
        nbrs = neighbors.get(node, [])
        if len(nbrs) > 0:
            dists = []
            for nbr in nbrs:
                dot_val = torch.dot(coords[node], coords[nbr]).clamp(-1, 1)
                d = torch.acos(dot_val).item()
                dists.append(d)
            mean_dist[node] = sum(dists) / len(dists) / math.pi
            min_dist[node]  = min(dists) / math.pi
            max_dist[node]  = max(dists) / math.pi
            if len(dists) > 1:
                mu = sum(dists) / len(dists)
                var_dist[node] = sum((d - mu)**2 for d in dists) / len(dists) / (math.pi**2)

            if len(nbrs) >= 2:
                angles = []
                for i_n in range(len(nbrs)):
                    for j_n in range(i_n + 1, len(nbrs)):
                        v1 = coords[nbrs[i_n]] - coords[node]
                        v2 = coords[nbrs[j_n]] - coords[node]
                        cos_a = F.cosine_similarity(v1.unsqueeze(0), v2.unsqueeze(0)).clamp(-1, 1)
                        angles.append(torch.acos(cos_a).item())
                mean_angle[node] = sum(angles) / len(angles) / math.pi

    # ── Clustering coefficient ──
    clustering = torch.zeros(num_nodes, 1)
    for node in range(num_nodes):
        nbrs = neighbors.get(node, [])
        k = len(nbrs)
        if k >= 2:
            triangles = 0
            for i_n in range(k):
                nbr_i_neighbors = set(neighbors.get(nbrs[i_n], []))
                for j_n in range(i_n + 1, k):
                    if nbrs[j_n] in nbr_i_neighbors:
                        triangles += 1
            clustering[node] = triangles / (k * (k - 1) / 2)

    # ── BFS: eccentricitate + closeness centrality ──
    eccentricity = torch.zeros(num_nodes, 1)
    closeness    = torch.zeros(num_nodes, 1)
    diameter_val = 0

    for node in range(num_nodes):
        dist_bfs = [-1] * num_nodes
        dist_bfs[node] = 0
        queue = deque([node])
        while queue:
            u = queue.popleft()
            for v in neighbors.get(u, []):
                if dist_bfs[v] == -1:
                    dist_bfs[v] = dist_bfs[u] + 1
                    queue.append(v)
        reachable = [d for d in dist_bfs if d > 0]
        if reachable:
            ecc = max(reachable)
            eccentricity[node] = ecc
            diameter_val = max(diameter_val, ecc)
            total_dist = sum(reachable)
            closeness[node] = len(reachable) / total_dist if total_dist > 0 else 0

    if diameter_val > 0:
        eccentricity = eccentricity / diameter_val

    # ── Spectral: top eigenvalue matrice adiacență ──
    top_eigenvalue = 0.0
    if num_nodes > 1 and edge_index.size(1) > 0:
        adj = torch.zeros(num_nodes, num_nodes)
        for i in range(edge_index.size(1)):
            adj[edge_index[0, i], edge_index[1, i]] = 1.0
        try:
            eigenvalues = torch.linalg.eigvalsh(adj)
            top_eigenvalue = eigenvalues[-1].item()
        except Exception:
            top_eigenvalue = 0.0

    # ── Features globale (broadcast la toate nodurile) ──
    num_nodes_feat  = torch.full((num_nodes, 1), num_nodes / 30.0)
    num_edges_feat  = torch.full((num_nodes, 1), num_edges_undirected / 60.0)
    bright_mean     = torch.full((num_nodes, 1), brightness.mean().item())
    bright_std      = torch.full((num_nodes, 1), brightness.std().item() if num_nodes > 1 else 0.0)
    bright_max      = torch.full((num_nodes, 1), brightness.max().item())
    max_possible    = num_nodes * (num_nodes - 1) / 2 if num_nodes > 1 else 1
    density         = torch.full((num_nodes, 1), num_edges_undirected / max_possible)
    diameter_feat   = torch.full((num_nodes, 1), diameter_val / max(num_nodes, 1))
    eigenvalue_feat = torch.full((num_nodes, 1), top_eigenvalue / max(num_nodes, 1))

    # ── Concatenăm 20 features ──
    new_x = torch.cat([
        brightness,       # 0
        degree_norm,      # 1
        degree_abs,       # 2
        mean_dist,        # 3
        min_dist,         # 4
        max_dist,         # 5
        var_dist,         # 6
        mean_angle,       # 7
        clustering,       # 8  NEW
        eccentricity,     # 9  NEW
        closeness,        # 10 NEW
        degree_ratio,     # 11 NEW
        num_nodes_feat,   # 12
        num_edges_feat,   # 13
        bright_mean,      # 14
        bright_std,       # 15
        bright_max,       # 16
        density,          # 17
        diameter_feat,    # 18 NEW
        eigenvalue_feat,  # 19 NEW
    ], dim=1)  # [N, 20]

    # ── Edge features: distanța unghiulară normalizată ──
    if edge_index.size(1) > 0:
        edge_dists = []
        for i in range(edge_index.size(1)):
            src, dst = edge_index[0, i].item(), edge_index[1, i].item()
            dot_val = torch.dot(coords[src], coords[dst]).clamp(-1, 1)
            d = torch.acos(dot_val).item() / math.pi
            edge_dists.append(d)
        edge_attr = torch.tensor(edge_dists, dtype=torch.float).unsqueeze(1)  # [E, 1]
    else:
        edge_attr = torch.zeros(0, 1)

    return Data(x=new_x, edge_index=data.edge_index, edge_attr=edge_attr, y=data.y)


# ═══════════════════════════ MODEL ══════════════════════════════

class GINELayer(nn.Module):
    """Un layer GINE cu edge features și skip connection rezidual."""
    def __init__(self, in_dim, out_dim, edge_dim=1):
        super().__init__()
        self.mlp = nn.Sequential(
            nn.Linear(in_dim, out_dim),
            nn.BatchNorm1d(out_dim),
            nn.ReLU(),
            nn.Linear(out_dim, out_dim),
        )
        self.conv = GINEConv(self.mlp, train_eps=True, edge_dim=edge_dim)
        self.bn = BatchNorm(out_dim)
        # Proiecție rezidualǎ dacă dimensiunile diferă
        self.residual = nn.Linear(in_dim, out_dim) if in_dim != out_dim else nn.Identity()

    def forward(self, x, edge_index, edge_attr):
        h = self.conv(x, edge_index, edge_attr)
        h = self.bn(h)
        return F.relu(h + self.residual(x))


class ConstellationGINE(nn.Module):
    """
    GINE (GIN + Edge features) cu JumpingKnowledge-style concatenation
    și skip connections reziduale.

    Pooling: sum + mean + max (× num_layers) → MLP classifier.
    """
    def __init__(self, in_channels, hidden_channels, num_classes,
                 num_layers=4, dropout=0.15, edge_dim=1):
        super().__init__()
        self.num_layers = num_layers
        self.dropout = dropout

        self.layers = nn.ModuleList()
        self.layers.append(GINELayer(in_channels, hidden_channels, edge_dim=edge_dim))
        for _ in range(num_layers - 1):
            self.layers.append(GINELayer(hidden_channels, hidden_channels, edge_dim=edge_dim))

        pool_dim = hidden_channels * num_layers * 3  # 3 = sum + mean + max

        self.classifier = nn.Sequential(
            nn.Linear(pool_dim, hidden_channels),
            nn.BatchNorm1d(hidden_channels),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_channels, hidden_channels // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_channels // 2, num_classes),
        )

    def forward(self, x, edge_index, edge_attr, batch):
        layer_outputs = []
        for layer in self.layers:
            x = layer(x, edge_index, edge_attr)
            x = F.dropout(x, p=self.dropout, training=self.training)
            layer_outputs.append(x)

        graph_reprs = []
        for h in layer_outputs:
            graph_reprs.append(global_add_pool(h, batch))
            graph_reprs.append(global_mean_pool(h, batch))
            graph_reprs.append(global_max_pool(h, batch))

        out = torch.cat(graph_reprs, dim=1)
        return self.classifier(out)


# ═══════════════════════════ FOCAL LOSS ═════════════════════════

class FocalLoss(nn.Module):
    """
    Focal Loss: pune accent pe exemplele dificile (greu de clasificat).
    FL(p_t) = -alpha * (1 - p_t)^gamma * log(p_t)
    """
    def __init__(self, gamma=2.0, label_smoothing=0.05):
        super().__init__()
        self.gamma = gamma
        self.label_smoothing = label_smoothing

    def forward(self, logits, targets):
        ce_loss = F.cross_entropy(logits, targets, reduction='none',
                                  label_smoothing=self.label_smoothing)
        pt = torch.exp(-ce_loss)
        focal_loss = ((1 - pt) ** self.gamma) * ce_loss
        return focal_loss.mean()


# ═══════════════════════════ FUNCȚII UTILE ══════════════════════

def load_dataset(path):
    """Încarcă dataset-ul și returnează lista de Data objects."""
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Nu am găsit {path}. Rulează mai întâi:\n"
            f"  python pipeline_all_official_graphs.py\n"
            f"  python augment_data.py"
        )
    dataset = torch.load(path, weights_only=False)
    print(f"Dataset încărcat: {len(dataset)} grafuri")
    return dataset


def preprocess_dataset(dataset):
    """Aplică feature engineering pe tot dataset-ul."""
    print("Calculez features invariante la rotație (20 features + edge attrs)...")
    processed = []
    for i, data in enumerate(dataset):
        processed.append(compute_invariant_features(data))
        if (i + 1) % 500 == 0:
            print(f"  Procesate {i+1}/{len(dataset)} grafuri...")
    sample = processed[0]
    print(f"  Features noi per nod: {sample.x.shape[1]}")
    print(f"  Edge features per muchie: {sample.edge_attr.shape[1] if sample.edge_attr.size(0) > 0 else 0}")
    return processed


def split_dataset(dataset, test_size=0.15, val_size=0.15, seed=42):
    """Împarte dataset-ul în train / val / test stratificat pe label."""
    random.seed(seed)
    label_to_indices = defaultdict(list)
    for i, d in enumerate(dataset):
        label_to_indices[int(d.y.item())].append(i)

    train_idx, val_idx, test_idx = [], [], []

    for label, indices in label_to_indices.items():
        shuffled = indices.copy()
        random.shuffle(shuffled)
        n = len(shuffled)
        n_test = max(1, int(n * test_size))
        n_val  = max(1, int(n * val_size))
        test_idx.extend(shuffled[:n_test])
        val_idx.extend(shuffled[n_test:n_test + n_val])
        train_idx.extend(shuffled[n_test + n_val:])

    train_data = [dataset[i] for i in train_idx]
    val_data   = [dataset[i] for i in val_idx]
    test_data  = [dataset[i] for i in test_idx]

    print(f"Split: Train={len(train_data)}, Val={len(val_data)}, Test={len(test_data)}")
    return train_data, val_data, test_data


def train_one_epoch(model, loader, optimizer, device, criterion):
    """Un epoch de antrenare cu Focal Loss."""
    model.train()
    total_loss = 0
    correct = 0
    total = 0

    for batch in loader:
        batch = batch.to(device)
        optimizer.zero_grad()
        out = model(batch.x, batch.edge_index, batch.edge_attr, batch.batch)
        loss = criterion(out, batch.y.view(-1))
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=2.0)
        optimizer.step()

        total_loss += loss.item() * batch.num_graphs
        pred = out.argmax(dim=1)
        correct += (pred == batch.y.view(-1)).sum().item()
        total += batch.num_graphs

    return total_loss / total, correct / total


@torch.no_grad()
def evaluate(model, loader, device):
    """Evaluare pe un DataLoader (val sau test)."""
    model.eval()
    total_loss = 0
    correct = 0
    total = 0
    all_preds = []
    all_labels = []

    for batch in loader:
        batch = batch.to(device)
        out = model(batch.x, batch.edge_index, batch.edge_attr, batch.batch)
        loss = F.cross_entropy(out, batch.y.view(-1))

        total_loss += loss.item() * batch.num_graphs
        pred = out.argmax(dim=1)
        correct += (pred == batch.y.view(-1)).sum().item()
        total += batch.num_graphs

        all_preds.extend(pred.cpu().numpy())
        all_labels.extend(batch.y.view(-1).cpu().numpy())

    return total_loss / total, correct / total, np.array(all_preds), np.array(all_labels)


def plot_training_curves(train_losses, val_losses, train_accs, val_accs, save_path="training_curves.png"):
    """Salvează graficele de loss și accuracy."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    epochs = range(1, len(train_losses) + 1)

    ax1.plot(epochs, train_losses, label="Train Loss", color="steelblue")
    ax1.plot(epochs, val_losses,   label="Val Loss",   color="darkorange")
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Loss")
    ax1.set_title("Loss")
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    ax2.plot(epochs, train_accs, label="Train Acc", color="steelblue")
    ax2.plot(epochs, val_accs,   label="Val Acc",   color="darkorange")
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Accuracy")
    ax2.set_title("Accuracy")
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close()
    print(f"Curbele de antrenare salvate în: {save_path}")


# ═══════════════════════════ MAIN ═══════════════════════════════

def main():
    print(f"Device: {DEVICE}")
    print("=" * 60)

    # 1. Încărcare dataset
    raw_dataset = load_dataset(DATASET_PATH)

    # 2. Feature engineering — transformăm (x,y,z,brightness) în 20 features invariante + edge attrs
    dataset = preprocess_dataset(raw_dataset)

    # Label map
    idx_to_name = None
    if os.path.exists(LABEL_MAP_PATH):
        label_map = torch.load(LABEL_MAP_PATH, weights_only=False)
        if isinstance(label_map, dict) and all(isinstance(v, (int, str)) for v in label_map.values()):
            idx_to_name = {v: k for k, v in label_map.items()}
            print(f"Label map încărcat din fișier: {len(idx_to_name)} constelații")
        elif isinstance(label_map, list) and len(label_map) > 0 and isinstance(label_map[0], str):
            idx_to_name = {i: name for i, name in enumerate(label_map)}
            print(f"Label map încărcat din fișier: {len(idx_to_name)} constelații")
        else:
            print("Label map din fișier nu are format recunoscut, folosesc fallback.")

    if idx_to_name is None:
        idx_to_name = {i: name for i, name in enumerate(CONSTELLATION_NAMES)}
        print(f"Label map fallback: {len(idx_to_name)} constelații")

    sample = dataset[0]
    in_channels = sample.x.shape[1]   # 20 features invariante
    num_classes = len(set(int(d.y.item()) for d in dataset))
    print(f"Features per nod: {in_channels}")
    print(f"Număr de clase: {num_classes}")
    print("=" * 60)

    # 3. Split train/val/test
    train_data, val_data, test_data = split_dataset(dataset)

    train_loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True)
    val_loader   = DataLoader(val_data,   batch_size=BATCH_SIZE)
    test_loader  = DataLoader(test_data,  batch_size=BATCH_SIZE)

    # 4. Creare model GINE
    model = ConstellationGINE(
        in_channels=in_channels,
        hidden_channels=HIDDEN_DIM,
        num_classes=num_classes,
        num_layers=4,
        dropout=DROPOUT,
        edge_dim=EDGE_DIM
    ).to(DEVICE)

    print(f"\nArhitectura modelului:\n{model}\n")
    total_params = sum(p.numel() for p in model.parameters())
    print(f"Total parametri: {total_params:,}")
    print("=" * 60)

    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)

    # LR schedule: warmup liniar 10 epoci + cosine decay
    warmup_sched  = torch.optim.lr_scheduler.LinearLR(
        optimizer, start_factor=0.01, total_iters=WARMUP_EPOCHS)
    cosine_sched  = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=NUM_EPOCHS - WARMUP_EPOCHS, eta_min=1e-5)
    scheduler = torch.optim.lr_scheduler.SequentialLR(
        optimizer, schedulers=[warmup_sched, cosine_sched], milestones=[WARMUP_EPOCHS])

    # Focal Loss
    criterion = FocalLoss(gamma=FOCAL_GAMMA, label_smoothing=LABEL_SMOOTHING)

    # 5. Antrenare cu early stopping
    best_val_acc = 0.0
    patience_counter = 0
    train_losses, val_losses = [], []
    train_accs, val_accs = [], []

    print("\nÎncep antrenarea...\n")
    for epoch in range(1, NUM_EPOCHS + 1):
        train_loss, train_acc = train_one_epoch(
            model, train_loader, optimizer, DEVICE, criterion
        )
        val_loss, val_acc, _, _ = evaluate(model, val_loader, DEVICE)

        scheduler.step()

        train_losses.append(train_loss)
        val_losses.append(val_loss)
        train_accs.append(train_acc)
        val_accs.append(val_acc)

        if epoch % 10 == 0 or epoch == 1:
            lr_now = optimizer.param_groups[0]['lr']
            print(f"Epoch {epoch:3d}/{NUM_EPOCHS} | "
                  f"Train Loss: {train_loss:.4f}  Acc: {train_acc:.4f} | "
                  f"Val Loss: {val_loss:.4f}  Acc: {val_acc:.4f} | "
                  f"LR: {lr_now:.6f}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            patience_counter = 0
            torch.save(model.state_dict(), SAVE_MODEL_PATH)
        else:
            patience_counter += 1
            if patience_counter >= PATIENCE:
                print(f"\nEarly stopping la epoch {epoch} (patience={PATIENCE})")
                break

    print(f"\nCea mai bună Val Accuracy: {best_val_acc:.4f} ({best_val_acc*100:.1f}%)")

    # 6. Evaluare finală pe test
    print("\n" + "=" * 60)
    print("Evaluare pe setul de TEST (cu cel mai bun model):")
    print("=" * 60)

    model.load_state_dict(torch.load(SAVE_MODEL_PATH, weights_only=False))
    test_loss, test_acc, preds, labels = evaluate(model, test_loader, DEVICE)
    print(f"Test Loss: {test_loss:.4f}  |  Test Accuracy: {test_acc:.4f}  ({test_acc*100:.1f}%)")

    # Raport de clasificare
    unique_labels = sorted(set(labels))
    print(f"\nClassification Report (per-constelație):")
    print(f"{'Constelație':<25} {'Precision':>10} {'Recall':>10} {'F1':>10} {'Support':>10}")
    print("-" * 65)
    for lbl in unique_labels:
        name = str(idx_to_name.get(lbl, f"Class_{lbl}")) if idx_to_name else f"Class_{lbl}"
        tp = int(sum(1 for t, p in zip(labels, preds) if t == lbl and p == lbl))
        fp = int(sum(1 for t, p in zip(labels, preds) if t != lbl and p == lbl))
        fn = int(sum(1 for t, p in zip(labels, preds) if t == lbl and p != lbl))
        support = int(sum(1 for t in labels if t == lbl))
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall    = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1        = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
        print(f"{name:<25} {precision:>10.2f} {recall:>10.2f} {f1:>10.2f} {support:>10d}")
    overall_acc = sum(1 for t, p in zip(labels, preds) if t == p) / len(labels)
    print("-" * 65)
    print(f"{'Overall Accuracy':<25} {overall_acc:>10.4f}")

    # 7. Salvare curbe de antrenare
    plot_training_curves(train_losses, val_losses, train_accs, val_accs)

    # 8. Top constelații greșite
    misclassified = Counter()
    for true, pred in zip(labels, preds):
        if true != pred:
            name = str(idx_to_name.get(true, f"Class_{true}")) if idx_to_name else f"Class_{true}"
            misclassified[name] += 1

    if misclassified:
        print("\nTop constelații cel mai des confundate:")
        for name, count in misclassified.most_common(10):
            print(f"  {name}: {count} erori")

    print(f"\nModelul salvat în: {SAVE_MODEL_PATH}")
    print("Done!")


if __name__ == "__main__":
    main()