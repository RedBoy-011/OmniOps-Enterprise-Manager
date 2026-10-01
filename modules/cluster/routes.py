# Cluster Nodes Management Blueprint
from flask import Blueprint, jsonify, request
import time
import json
from config.database import get_db_connection

cluster_bp = Blueprint('cluster', __name__)

# In-memory and persistent node registry
CLUSTER_NODES = {}

@cluster_bp.route('/nodes/register', methods=['POST'])
def register_node():
    """Register or heartbeat worker nodes into Master Control-Plane"""
    data = request.get_json() or {}
    node_name = data.get('node_name', f"worker-{int(time.time())}")
    ip = data.get('ip', request.remote_addr)
    port = data.get('port', 11434)
    role = data.get('role', 'llm_heavy')
    specs = data.get('specs', {})

    CLUSTER_NODES[node_name] = {
        'node_name': node_name,
        'ip': ip,
        'port': port,
        'role': role,
        'specs': specs,
        'status': 'online',
        'last_seen': int(time.time())
    }

    print(f"[+] Worker Node Registered: {node_name} ({ip}:{port}) - RAM: {specs.get('ram_total_gb')} GB, GPU: {specs.get('gpu_name')}")

    return jsonify({
        'status': 'success',
        'message': f'Worker node {node_name} successfully registered to cluster',
        'cluster_size': len(CLUSTER_NODES),
        'node': CLUSTER_NODES[node_name]
    }), 200

@cluster_bp.route('/nodes', methods=['GET'])
def list_nodes():
    return jsonify({
        'nodes': list(CLUSTER_NODES.values()),
        'total': len(CLUSTER_NODES)
    })
