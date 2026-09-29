# Auth Routes Blueprint
from flask import Blueprint, request, jsonify, g
from modules.auth.models import User, Role
from modules.auth.decorators import generate_token, login_required, super_admin_required, admin_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'error': 'Bad Request', 'message': 'نام کاربری و کلمه عبور الزامی است'}), 400

    user = User.get_by_username(username)
    if not user or not User.verify_password(user['password_hash'], password):
        return jsonify({'error': 'Unauthorized', 'message': 'نام کاربری یا رمز عبور اشتباه است'}), 401

    if not user['is_active']:
        return jsonify({'error': 'Forbidden', 'message': 'این حساب کاربری غیرفعال است'}), 403

    token = generate_token(user)
    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role'],
            'full_name': user['full_name']
        }
    })

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    user = g.current_user
    return jsonify({
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role'],
            'full_name': user['full_name']
        }
    })

@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    data = request.get_json() or {}
    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')

    if not User.verify_password(g.current_user['password_hash'], old_password):
        return jsonify({'error': 'Bad Request', 'message': 'رمز عبور فعلی نادرست است'}), 400

    if len(new_password) < 6:
        return jsonify({'error': 'Bad Request', 'message': 'رمز عبور جدید باید حداقل ۶ نویسه باشد'}), 400

    User.update_password(g.current_user['id'], new_password)
    return jsonify({'success': True, 'message': 'رمز عبور با موفقیت به‌روزرسانی شد'})

@auth_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    users = User.list_all()
    return jsonify({'users': users})

@auth_bp.route('/users', methods=['POST'])
@super_admin_required
def create_new_user():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    role = data.get('role', Role.USER)
    full_name = data.get('full_name', '')

    if not username or not email or not password:
        return jsonify({'error': 'Bad Request', 'message': 'فیلدهای نام کاربری، ایمیل و رمز عبور اجباری هستند'}), 400

    if role not in Role.ALL:
        return jsonify({'error': 'Bad Request', 'message': f'نقش نامعتبر است. مجاز: {Role.ALL}'}), 400

    try:
        user = User.create_user(username, email, password, role, full_name)
        return jsonify({'user': user, 'message': 'کاربر جدید با موفقیت ایجاد شد'}), 201
    except Exception as e:
        return jsonify({'error': 'Conflict', 'message': f'خطا در ایجاد کاربر (ممکن است نام کاربری یا ایمیل تکراری باشد): {str(e)}'}), 409
