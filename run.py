# OmniOps Enterprise Manager - Python Architecture Specification & Direct Run
# این پروژه منطبق با معماری Flask Blueprints طراحی شده و می‌تواند به صورت سرور پایتون یا در کانتینر اوبونتو اجرا شود.

import os
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
from core.model_manager import start_background_model_monitor

def create_app(config_class=Config):
    app = Flask(__name__, static_folder='static', template_folder='templates')
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

    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'app': 'OmniOps Enterprise Manager',
            'version': '1.0.0',
            'architecture': 'Flask Blueprints & Modular'
        })

    # SPA Fallback route
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_spa(path):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.template_folder, 'index.html')

    # Start periodic background model health checker
    start_background_model_monitor(interval_seconds=180)

    return app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app = create_app()
    print(f"[*] OmniOps Enterprise running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
