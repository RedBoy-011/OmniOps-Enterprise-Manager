# Auth Decorators and Role-Based Access Control
from functools import wraps
from flask import request, jsonify, g
import jwt
from config.settings import Config
from modules.auth.models import User, Role

def generate_token(user_data: dict) -> str:
    payload = {
        'id': user_data['id'],
        'username': user_data['username'],
        'role': user_data['role'],
        'email': user_data['email']
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')

def decode_token(token: str):
    try:
        return jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
    except Exception:
        return None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized', 'message': 'توکن احراز هویت الزامی است'}), 401
        
        token = auth_header.split(' ')[1]
        decoded = decode_token(token)
        if not decoded:
            return jsonify({'error': 'Invalid token', 'message': 'توکن نامعتبر یا منقضی شده است'}), 401
        
        user = User.get_by_id(decoded['id'])
        if not user or not user['is_active']:
            return jsonify({'error': 'User inactive', 'message': 'حساب کاربری مسدود شده یا یافت نشد'}), 403
        
        g.current_user = user
        return f(*args, **kwargs)
    return decorated_function

def role_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        @login_required
        def decorated_function(*args, **kwargs):
            user_role = g.current_user.get('role')
            if user_role not in allowed_roles:
                return jsonify({
                    'error': 'Forbidden',
                    'message': f'سطح دسترسی شما ({user_role}) برای این عملیات مجاز نیست. نیازمند: {", ".join(allowed_roles)}'
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Convenience decorators
super_admin_required = role_required([Role.SUPER_ADMIN])
admin_required = role_required([Role.SUPER_ADMIN, Role.ADMIN])
