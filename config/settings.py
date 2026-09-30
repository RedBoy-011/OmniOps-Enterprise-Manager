# Config module for OmniOps Enterprise Manager
import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'omniops-enterprise-super-secret-key-2026')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///omniops_enterprise.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Session & JWT
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
    
    # Default Network & Proxy Defaults
    DEFAULT_SOCKS5_HOST = os.environ.get('SOCKS5_HOST', '127.0.0.1')
    DEFAULT_SOCKS5_PORT = int(os.environ.get('SOCKS5_PORT', 1080))
    DEFAULT_SOCKS5_ENABLED = os.environ.get('SOCKS5_ENABLED', 'false').lower() == 'true'

    # GitHub Updates
    GITHUB_REPO_URL = os.environ.get('GITHUB_REPO_URL', 'https://github.com/RedBoy-011/OmniOps-Enterprise-Manager')
    DEFAULT_SERVER_PORT = int(os.environ.get('PORT', 8080))
