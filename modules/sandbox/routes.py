# Sandboxed Execution API Routes baraye OmniOps Enterprise
# Hameye comment-haye in code be darkhaste karbar be zabane Finglish neveshte shodeand.

from flask import Blueprint, request, jsonify, Response
from modules.sandbox.executor import SandboxExecutor

sandbox_bp = Blueprint('sandbox', __name__)

@sandbox_bp.route('/execute', methods=['POST'])
def execute_command():
    data = request.get_json() or {}
    command = data.get('command', '').strip()
    environment = data.get('environment', 'docker') # 'docker' ya 'microvm'
    user_id = data.get('user_id', 'user')

    if not command:
        return jsonify({'error': 'Bad Request', 'message': 'Dastoor baraye ejra elzami ast'}), 400

    job = SandboxExecutor.create_job(command, environment, user_id)
    return jsonify({
        'status': 'queued',
        'job_id': job['id'],
        'environment': job['environment'],
        'stream_url': f'/api/v1/sandbox/stream/{job["id"]}'
    }), 202

@sandbox_bp.route('/stream/<job_id>', methods=['GET'])
def stream_job_logs(job_id: str):
    """
    Endpoint-e Server-Sent Events (SSE) baraye daryafte real-time stdout/stderr
    """
    job = SandboxExecutor.get_job(job_id)
    if not job:
        return jsonify({'error': 'NotFound', 'message': 'Job peyda nashod'}), 404

    return Response(
        SandboxExecutor.stream_job_events(job_id),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive'
        }
    )

@sandbox_bp.route('/jobs/<job_id>', methods=['GET'])
def get_job_status(job_id: str):
    job = SandboxExecutor.get_job(job_id)
    if not job:
        return jsonify({'error': 'NotFound', 'message': 'Job peyda nashod'}), 404
    return jsonify({'job': job})
