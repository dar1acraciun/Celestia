"""
ML Service — Flask

POST /predict             multipart/form-data  field: image  — GNN model
POST /predict/astrometry  multipart/form-data  field: image  — Astrometry.net
POST /predict/all         multipart/form-data  field: image  — ambele, comparativ

Set env var ASTROMETRY_API_KEY with your key from nova.astrometry.net
"""

import os
import sys
import time
import tempfile

import requests
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(SCRIPT_DIR, '.env'))
sys.path.insert(0, os.path.join(SCRIPT_DIR, 'model'))

from run_pipeline import detect_stars, build_pyg_graph, predict_constellation, load_model
from draw_constellation_lines import get_official_edges

MODEL_PATH = os.path.join(SCRIPT_DIR, 'model', 'best_constellation_gine (5).pt')

print("Loading model into memory...")
_MODEL = load_model(MODEL_PATH)
print("Model loaded.")
ASTROMETRY_API_KEY = os.environ.get('ASTROMETRY_API_KEY', '')
ASTROMETRY_BASE = 'https://nova.astrometry.net/api'

app = Flask(__name__)
CORS(app)


@app.route('/health', methods=['GET'])
def health():
    try:
        import torch
        import torch_geometric
        torch_version = torch.__version__
        pyg_version = torch_geometric.__version__
        model_exists = os.path.exists(MODEL_PATH)
        return jsonify({
            'status': 'ok',
            'torch': torch_version,
            'torch_geometric': pyg_version,
            'model_exists': model_exists,
            'model_path': MODEL_PATH,
        })
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


# ── helpers ──────────────────────────────────────────────────────────────────

def _save_temp(file):
    suffix = os.path.splitext(file.filename)[1] or '.jpg'
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    file.save(tmp.name)
    tmp.close()
    return tmp.name


def _gnn_predict(tmp_path):
    stars, brightness_vals, edges, img, _ = detect_stars(tmp_path)
    graph = build_pyg_graph(stars, brightness_vals, edges, img.shape)
    best_name, best_prob, top5 = predict_constellation(
        graph, MODEL_PATH, top_k=5, return_top=True, preloaded_model=_MODEL
    )
    coords_3d = graph.x[:, :3].numpy()
    line_edges = get_official_edges(coords_3d, best_name)

    return {
        'constellation': best_name,
        'confidence': round(float(best_prob), 4),
        'top5': [{'name': n, 'confidence': round(float(c), 4)} for n, c in top5],
        'stars': [
            {'x': float(s[0]), 'y': float(s[1]), 'brightness': float(b)}
            for s, b in zip(stars, brightness_vals)
        ],
        'lines': [
            {'from': int(min(e)), 'to': int(max(e))}
            for e in line_edges
        ],
    }


def _astrometry_predict(tmp_path):
    if not ASTROMETRY_API_KEY:
        raise ValueError('ASTROMETRY_API_KEY not set')

    # 1. Login → session key
    r = requests.post(f'{ASTROMETRY_BASE}/login',
                      data={'request-json': f'{{"apikey":"{ASTROMETRY_API_KEY}"}}'})
    r.raise_for_status()
    session = r.json()['session']

    # 2. Upload imagine
    with open(tmp_path, 'rb') as f:
        r = requests.post(
            f'{ASTROMETRY_BASE}/upload',
            data={'request-json': f'{{"session":"{session}"}}'},
            files={'file': f},
        )
    r.raise_for_status()
    subid = r.json()['subid']

    # 3. Asteapta job
    job_id = None
    for _ in range(30):
        time.sleep(5)
        info = requests.get(f'{ASTROMETRY_BASE}/submissions/{subid}').json()
        jobs = info.get('jobs') or []
        if jobs and jobs[0]:
            job_id = jobs[0]
            break

    if not job_id:
        raise TimeoutError('Astrometry.net job timed out after 150s')

    # 4. Asteapta rezultat
    for _ in range(20):
        time.sleep(5)
        status = requests.get(f'{ASTROMETRY_BASE}/jobs/{job_id}').json()
        if status.get('status') == 'success':
            break
        if status.get('status') == 'failure':
            raise RuntimeError('Astrometry.net job failed')

    # 5. Extrage obiecte detectate
    result = requests.get(f'{ASTROMETRY_BASE}/jobs/{job_id}/info').json()
    objects = result.get('objects_in_field', [])
    calibration = result.get('calibration', {})

    # Filtreaza doar constelațiile din lista de obiecte
    constellations = [o for o in objects if any(
        kw in o for kw in ['Constellation', 'constellation']
    )] or objects

    return {
        'objects_in_field': objects,
        'constellation': constellations[0] if constellations else None,
        'calibration': calibration,
        'job_id': job_id,
    }


# ── routes ───────────────────────────────────────────────────────────────────

def _get_image_file():
    if 'image' not in request.files or request.files['image'].filename == '':
        return None, jsonify({'error': 'No image uploaded'}), 400
    return request.files['image'], None, None


@app.route('/predict', methods=['POST'])
def predict():
    file, err, code = _get_image_file()
    if err:
        return err, code
    tmp_path = _save_temp(file)
    try:
        return jsonify(_gnn_predict(tmp_path))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        os.unlink(tmp_path)


@app.route('/predict/astrometry', methods=['POST'])
def predict_astrometry():
    file, err, code = _get_image_file()
    if err:
        return err, code
    tmp_path = _save_temp(file)
    try:
        return jsonify(_astrometry_predict(tmp_path))
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        os.unlink(tmp_path)


@app.route('/predict/all', methods=['POST'])
def predict_all():
    file, err, code = _get_image_file()
    if err:
        return err, code
    tmp_path = _save_temp(file)
    result = {}
    try:
        result['gnn'] = _gnn_predict(tmp_path)
    except Exception as e:
        result['gnn'] = {'error': str(e)}
    try:
        result['astrometry'] = _astrometry_predict(tmp_path)
    except Exception as e:
        result['astrometry'] = {'error': str(e)}
    os.unlink(tmp_path)
    return jsonify(result)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
