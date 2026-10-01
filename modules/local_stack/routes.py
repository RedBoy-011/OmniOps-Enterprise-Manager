# Local Stack Blueprint for OmniOps Enterprise Manager
from flask import Blueprint, jsonify, request
import subprocess
import urllib.request
import json
import os

local_stack_bp = Blueprint('local_stack', __name__)

@local_stack_bp.route('/status', methods=['GET'])
def get_status():
    """Check status of local AI engines (Ollama, Docker, etc.)"""
    ollama_online = False
    ollama_models = []
    
    try:
        req = urllib.request.Request("http://127.0.0.1:11434/api/tags")
        with urllib.request.urlopen(req, timeout=2) as resp:
            if resp.status == 200:
                ollama_online = True
                data = json.loads(resp.read().decode())
                ollama_models = [m.get('name') for m in data.get('models', [])]
    except Exception:
        ollama_online = False

    docker_running = False
    try:
        res = subprocess.run(["docker", "ps", "--format", "{{.Names}}"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=3)
        docker_running = (res.returncode == 0)
        containers = [line.strip() for line in res.stdout.splitlines() if line.strip()]
    except Exception:
        docker_running = False
        containers = []

    return jsonify({
        'status': 'success',
        'docker': {
            'running': docker_running,
            'containers': containers
        },
        'ollama': {
            'online': ollama_online,
            'models': ollama_models,
            'port': 11434
        }
    })
