# OmniOps Enterprise Manager - Python Architecture Specification & Direct Run
# این پروژه منطبق با معماری Flask Blueprints طراحی شده و می‌تواند به صورت سرور پایتون یا در کانتینر اوبونتو اجرا شود.

import os
import sys

# Ensure project root directory is at the beginning of sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from config.settings import Config
from config.database import init_db

# Import Blueprints
from modules.auth.routes import auth_bp
from modules.settings.routes import settings_bp
from modules.tools.routes import tools_bp
from modules.chat.routes import chat_bp
from modules.local_stack.routes import local_stack_bp
from modules.cluster.routes import cluster_bp
from modules.sandbox.routes import sandbox_bp
from modules.mcp.routes import mcp_bp
from modules.skills.routes import skills_bp
from modules.chat.agent_routes import agent_bp
from core.model_manager import start_background_model_monitor

def create_app(config_class=Config):
    # Use dist if built by Vite, otherwise fallback gracefully
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(base_dir, 'dist')
    static_folder = dist_dir if os.path.exists(dist_dir) else os.path.join(base_dir, 'static')
    template_folder = dist_dir if os.path.exists(dist_dir) else os.path.join(base_dir, 'templates')

    app = Flask(__name__, static_folder=static_folder, template_folder=template_folder)
    app.config.from_object(config_class)

    # Initialize CORS
    CORS(app, supports_credentials=True)

    # Initialize Database
    init_db(app)

    # Register Blueprints with Prefixes
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    app.register_blueprint(tools_bp, url_prefix='/api/tools')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(local_stack_bp, url_prefix='/api/local-stack')
    app.register_blueprint(cluster_bp, url_prefix='/api/v1/cluster')
    app.register_blueprint(cluster_bp, url_prefix='/api/cluster')
    app.register_blueprint(sandbox_bp, url_prefix='/api/v1/sandbox')
    app.register_blueprint(mcp_bp, url_prefix='/api/v1/mcp')
    app.register_blueprint(skills_bp, url_prefix='/api/v1/skills')
    app.register_blueprint(agent_bp)

    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'app': 'OmniOps Enterprise Manager',
            'version': '1.0.0',
            'architecture': 'Flask Blueprints & Modular'
        })

    # Edge handshake endpoint
    @app.route('/api/v1/edge/handshake', methods=['GET', 'POST'])
    def edge_handshake():
        return jsonify({
            'status': 'success',
            'role': 'master',
            'message': 'Handshake verified successfully'
        })

    # SPA Fallback route
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_spa(path):
        if path != "" and app.static_folder and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        if app.template_folder and os.path.exists(os.path.join(app.template_folder, 'index.html')):
            return send_from_directory(app.template_folder, 'index.html')
        # Direct clean fallback if dist is building
        return """<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>OmniOps Enterprise Manager</title><style>body{background:#18181b;color:#f4f4f5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}</style></head><body><div style="text-align:center;"><h2>OmniOps Enterprise Master API</h2><p style="color:#a1a1aa;">هسته مرکزی با موفقیت در حال اجرا است. برای اتصال فرانت‌اند از بیلد وب یا نود لبه استفاده کنید.</p></div></body></html>"""

    # Start periodic background model health checker
    try:
        start_background_model_monitor(interval_seconds=180)
    except Exception as e:
        print(f"[-] Background monitor warning: {e}")

    return app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app = create_app()
    print(f"[*] OmniOps Enterprise running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
