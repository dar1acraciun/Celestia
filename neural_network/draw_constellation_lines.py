"""
Suprapune liniile oficiale ale constelației pe imaginea detectată.

Algoritm:
  1. Încarcă stelele catalog (RA/Dec → 3D) + liniile oficiale (ConstellationLines.csv)
  2. Aliniază catalogul pe stelele detectate via rotație Kabsch
     (nu necesită FOV exact sau orientarea camerei)
  3. Proiectează stelele catalog pe pixeli (invers față de pixels_to_sphere)
  4. Desenează liniile oficiale pe matplotlib Axes

Import în run_pipeline.py:
  from draw_constellation_lines import overlay_constellation_lines
"""

import os
import json
import math
import numpy as np

SCRIPT_DIR    = os.path.dirname(os.path.abspath(__file__))
PROCESSING_DIR = os.path.join(SCRIPT_DIR, "Processing")
CONST_JSON_DIR = os.path.join(PROCESSING_DIR, "constellations")
LINES_CSV      = os.path.join(PROCESSING_DIR, "ConstellationLines.csv")
MAPPINGS_DIR   = os.path.join(PROCESSING_DIR, "hr_to_hip_mappings")

NAME_TO_ABR = {
    'Andromeda': 'And', 'Antlia': 'Ant', 'Apus': 'Aps', 'Aquarius': 'Aqr', 'Aquila': 'Aql',
    'Ara': 'Ara', 'Aries': 'Ari', 'Auriga': 'Aur', 'Bootes': 'Boo', 'Caelum': 'Cae',
    'Camelopardalis': 'Cam', 'Cancer': 'Cnc', 'Canes Venatici': 'CVn', 'Canis Major': 'CMa',
    'Canis Minor': 'CMi', 'Capricornus': 'Cap', 'Carina': 'Car', 'Cassiopeia': 'Cas',
    'Centaurus': 'Cen', 'Cepheus': 'Cep', 'Cetus': 'Cet', 'Chamaeleon': 'Cha',
    'Circinus': 'Cir', 'Columba': 'Col', 'Coma Berenices': 'Com', 'Corona Australis': 'CrA',
    'Corona Borealis': 'CrB', 'Corvus': 'Crv', 'Crater': 'Crt', 'Crux': 'Cru',
    'Cygnus': 'Cyg', 'Delphinus': 'Del', 'Dorado': 'Dor', 'Draco': 'Dra',
    'Equuleus': 'Equ', 'Eridanus': 'Eri', 'Fornax': 'For', 'Gemini': 'Gem',
    'Grus': 'Gru', 'Hercules': 'Her', 'Horologium': 'Hor', 'Hydra': 'Hya',
    'Hydrus': 'Hyi', 'Indus': 'Ind', 'Lacerta': 'Lac', 'Leo': 'Leo',
    'Leo Minor': 'LMi', 'Lepus': 'Lep', 'Libra': 'Lib', 'Lupus': 'Lup',
    'Lynx': 'Lyn', 'Lyra': 'Lyr', 'Mensa': 'Men', 'Microscopium': 'Mic',
    'Monoceros': 'Mon', 'Musca': 'Mus', 'Norma': 'Nor', 'Octans': 'Oct',
    'Ophiuchus': 'Oph', 'Orion': 'Ori', 'Pavo': 'Pav', 'Pegasus': 'Peg',
    'Perseus': 'Per', 'Phoenix': 'Phe', 'Pictor': 'Pic', 'Pisces': 'Psc',
    'Piscis Austrinus': 'PsA', 'Puppis': 'Pup', 'Pyxis': 'Pyx', 'Reticulum': 'Ret',
    'Sagitta': 'Sge', 'Sagittarius': 'Sgr', 'Scorpius': 'Sco', 'Sculptor': 'Scl',
    'Scutum': 'Sct', 'Serpens': 'Ser', 'Sextans': 'Sex', 'Taurus': 'Tau',
    'Telescopium': 'Tel', 'Triangulum': 'Tri', 'Triangulum Australe': 'TrA',
    'Tucana': 'Tuc', 'Ursa Major': 'UMa', 'Ursa Minor': 'UMi', 'Vela': 'Vel',
    'Virgo': 'Vir', 'Volans': 'Vol', 'Vulpecula': 'Vul',
}


# ═══════════════════════ UTILITĂȚI CATALOG ═══════════════════════

def _ra_to_deg(s):
    s = s.replace('h', ' ').replace('m', ' ').replace('s', '')
    h, m, sec = [float(x) for x in s.split()]
    return (h + m / 60 + sec / 3600) * 15


def _dec_to_deg(s):
    s = (s.replace('\u2212', '-').replace('\u00b0', ' ')
          .replace('\u2032\u2032', ' ').replace('\u2032', ' ')
          .replace('°', ' ').replace("''", ' ').replace("'", ' '))
    parts = s.strip().split()
    sign = -1 if parts[0].startswith('-') else 1
    d = abs(float(parts[0]))
    m = float(parts[1]) if len(parts) > 1 else 0
    sec = float(parts[2]) if len(parts) > 2 else 0
    return sign * (d + m / 60 + sec / 3600)


def _ra_dec_to_3d(ra_deg, dec_deg):
    ra_r  = math.radians(ra_deg)
    dec_r = math.radians(dec_deg)
    return np.array([
        math.cos(dec_r) * math.cos(ra_r),
        math.cos(dec_r) * math.sin(ra_r),
        math.sin(dec_r),
    ], dtype=np.float64)


def load_catalog_stars(const_name):
    """
    Încarcă stelele catalog sortate după magnitudine (cele mai luminoase primele).
    Returns: list of {'hip': int|None, 'xyz': np.array[3], 'mag': float}
    """
    fname = const_name.replace(' ', '_') + '.json'
    path  = os.path.join(CONST_JSON_DIR, fname)
    if not os.path.exists(path):
        return []

    with open(path, encoding='utf-8') as f:
        data = json.load(f)

    stars = []
    for s in data['stars']:
        try:
            ra  = _ra_to_deg(s['Right Ascension'])
            dec = _dec_to_deg(s['Declination'])
            mag = float(s['Visual Magnitude']) if s.get('Visual Magnitude') else 6.0
            hip_raw = s.get('Hipparcos Number')
            hip = int(hip_raw) if hip_raw else None
            stars.append({'hip': hip, 'xyz': _ra_dec_to_3d(ra, dec), 'mag': mag})
        except Exception:
            continue

    stars.sort(key=lambda s: s['mag'])
    return stars


def load_constellation_lines(const_name):
    """
    Încarcă perechile de stele conectate oficial (din ConstellationLines.csv).
    Returns: list of (hip1, hip2) — perechi HIP conectate printr-o linie
    """
    abr = NAME_TO_ABR.get(const_name)
    if abr is None:
        return []

    map_file = os.path.join(MAPPINGS_DIR, f"hr_to_hip_{abr.lower()}.json")
    if not os.path.exists(map_file):
        return []

    with open(map_file) as f:
        hr_to_hip = json.load(f)

    pairs = []
    with open(LINES_CSV, encoding='utf-8') as f:
        for line in f:
            parts = [p.strip() for p in line.strip().split(',')]
            if not parts or parts[0] != abr:
                continue

            try:
                nr = int(parts[1])
            except (ValueError, IndexError):
                continue

            hr_seq = []
            for p in parts[2:2 + nr]:
                p = p.strip()
                if p:
                    try:
                        hr_seq.append(int(p))
                    except ValueError:
                        pass

            # Convertim HR → HIP și creăm perechi consecutive
            hip_seq = [hr_to_hip.get(str(hr)) for hr in hr_seq]
            for i in range(len(hip_seq) - 1):
                h1, h2 = hip_seq[i], hip_seq[i + 1]
                if h1 is not None and h2 is not None:
                    pairs.append((int(h1), int(h2)))
            break

    return pairs


# ═══════════════════════ KABSCH + PROIECȚIE ═══════════════════════

def _kabsch_rotation(P, Q):
    """
    Găsește rotația R care aliniază Q pe P: P ≈ (R @ Q.T).T
    P, Q: [N, 3] seturi de puncte corespunzătoare (vectori unitari).
    Returns: R [3, 3] matrice de rotație proprie (det=+1).
    """
    H = Q.T @ P          # [3, 3]
    U, _, Vt = np.linalg.svd(H)
    d = np.linalg.det(Vt.T @ U.T)   # +1 sau -1
    D = np.diag([1.0, 1.0, d])       # corectăm reflecțiile
    return Vt.T @ D @ U.T            # R: Q-frame → P-frame


def _icp_align(P, Q_all, max_iter=30):
    """
    Iterative Closest Point pe sferă unitară.
    Găsește rotația R care aliniază Q_all pe P.

    P:     [N, 3] stele detectate (vectori unitari, ordonate după brightness desc)
    Q_all: [M, 3] stele catalog (vectori unitari, ordonate după magnitudine asc)
            M ar trebui să fie mic (figure stars, nu tot catalogul)
    Returns: R [3,3], eroare medie angulară (rad)
    """
    n = len(P)
    m = len(Q_all)

    # Inițializare: potrivire după rang (detected[i] ↔ catalog[i] după luminozitate)
    n_init = min(n, m)
    R = _kabsch_rotation(P[:n_init], Q_all[:n_init])

    best_R = R
    best_err = float('inf')

    for _ in range(max_iter):
        Q_rot = (R @ Q_all.T).T      # [M, 3] catalog aliniat

        # Nearest neighbor cu bijectivitate (fiecare detected → un singur catalog)
        corr = []
        used = set()
        for i in range(n):
            dots = Q_rot @ P[i]      # [M] cosine similarities
            for j in np.argsort(-dots):
                if j not in used:
                    corr.append(int(j))
                    used.add(j)
                    break

        Q_matched = Q_all[corr]      # [n, 3]
        R_new = _kabsch_rotation(P, Q_matched)

        # Eroare curentă
        Q_check = (R_new @ Q_matched.T).T
        errs = np.arccos(np.clip((P * Q_check).sum(axis=1), -1, 1))
        err = float(errs.mean())

        if err < best_err:
            best_err = err
            best_R = R_new
            best_corr = corr

        diff = np.abs(R_new - R).max()
        R = R_new
        if diff < 1e-9:
            break

    return best_R, best_err


def _sphere_to_pixels(pts_3d, img_shape, fov_deg=60):
    """
    Inversul lui pixels_to_sphere: coordonate 3D → pixeli.
    Presupune că centrul imaginii corespunde direcției (1, 0, 0).
    Punctele cu x ≤ 0 (în spatele camerei) → None.
    """
    h, w = img_shape[:2]
    cx, cy = w / 2, h / 2
    scale  = math.tan(math.radians(fov_deg / 2)) / (max(w, h) / 2)

    pixels = []
    for pt in pts_3d:
        x, y, z = float(pt[0]), float(pt[1]), float(pt[2])
        if x <= 1e-6:
            pixels.append(None)
            continue
        px = cx + (y / x) / scale
        py = cy - (z / x) / scale
        pixels.append((px, py))
    return pixels


# ═══════════════════════ FUNCȚIE PRINCIPALĂ ═══════════════════════

def get_official_edges(detected_3d, const_name):
    """
    Returnează mulțimea perechilor (i, j) de indici ai stelelor detectate
    care corespund liniilor oficiale ale constelației.

    Corespondența se face prin rang de luminozitate:
      detected[0] (cea mai luminoasă) ↔ figure_star[0] (cea mai luminoasă din figura)

    Args:
        detected_3d:  np.array [N, 3] — coordonate 3D, ordonate după luminozitate desc
        const_name:   constelația prezisă

    Returns:
        official_pairs: set of frozenset({i, j}) perechi de indici detectați
    """
    catalog = load_catalog_stars(const_name)
    line_pairs = load_constellation_lines(const_name)
    if not catalog or not line_pairs:
        return set()

    # Figure stars = stelele care apar în liniile oficiale, sortate după magnitudine
    hip_to_cat_idx = {s['hip']: i for i, s in enumerate(catalog) if s['hip'] is not None}
    hips_in_lines  = set(h for h1, h2 in line_pairs for h in (h1, h2))
    figure_indices = sorted([hip_to_cat_idx[h] for h in hips_in_lines if h in hip_to_cat_idx])

    # Corespondență: detected[i] ↔ figure_stars[i] (ambele ordonate după luminozitate)
    n = min(len(detected_3d), len(figure_indices))
    # catalog global index → detected index (primele n corespondenețe)
    cat_to_det = {figure_indices[fi]: fi for fi in range(n)}

    # Deduplică perechile (poliliniile CSV duc la duplicate)
    official_pairs = set()
    for hip1, hip2 in line_pairs:
        ci1, ci2 = hip_to_cat_idx.get(hip1), hip_to_cat_idx.get(hip2)
        if ci1 is None or ci2 is None:
            continue
        di1, di2 = cat_to_det.get(ci1), cat_to_det.get(ci2)
        if di1 is None or di2 is None:
            continue
        if di1 != di2:
            official_pairs.add(frozenset({di1, di2}))

    return official_pairs


def overlay_constellation_lines(ax, stars_px, detected_3d, const_name):
    """
    Evidențiază liniile oficiale ale constelației pe ax (matplotlib Axes).

    Logică simplă: detected[i] ↔ figura star[i] după rang de luminozitate.
    Desenează cyan doar perechile de stele detectate care corespund liniilor oficiale.

    Args:
        ax:           matplotlib Axes
        stars_px:     np.array [N, 2] — pozițiile pixel ale stelelor detectate
        detected_3d:  np.array [N, 3] — coords 3D (din pixels_to_sphere)
        const_name:   constelația prezisă (ex: "Orion")

    Returns:
        n_lines: numărul de linii oficiale desenate
    """
    official_pairs = get_official_edges(detected_3d, const_name)

    n_drawn = 0
    for pair in official_pairs:
        di1, di2 = tuple(pair)
        p1, p2 = stars_px[di1], stars_px[di2]
        ax.plot([p1[0], p2[0]], [p1[1], p2[1]],
                color='cyan', linewidth=2.5, alpha=0.95, zorder=5,
                solid_capstyle='round')
        n_drawn += 1

    print(f"  [lines] Linii oficiale: {n_drawn} (din {len(load_constellation_lines(const_name))} posibile)")
    return n_drawn
