# Auth Routes Blueprint baraye OmniOps Enterprise
# Hameye comment-haye in code be darkhaste karbar be zabane Finglish neveshte shodeand.

from flask import Blueprint, request, jsonify, g
from modules.auth.models import User, Role, CyberDefense, LdapAuthenticator, AccessRequestModel
from modules.auth.decorators import generate_token, login_required, super_admin_required, admin_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    # Estekhraj IP karbar baraye defae cyberi va rate limiting
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr or '127.0.0.1')
    if ',' in client_ip:
        client_ip = client_ip.split(',')[0].strip()

    # Barresie ghofl boodane IP (Brute-Force check)
    is_locked, remaining_sec = CyberDefense.is_ip_locked(client_ip)
    if is_locked:
        return jsonify({
            'error': 'TooManyRequests',
            'message': f'Be dalile 5 bar talashe na-movafagh, dastresie in IP be moddate {remaining_sec} sanieh ghofl shode ast.',
            'remaining_seconds': remaining_sec
        }), 429

    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'error': 'Bad Request', 'message': 'Name karbari va ramze oboor elzami ast'}), 400

    # Ahraz hoviat az tarighe Local DB va Fallback be Active Directory (LDAPS)
    auth_result = LdapAuthenticator.authenticate_or_fallback(username, password)
    
    if not auth_result['authenticated'] or not auth_result['user']:
        # Sabte talashe na-movafagh dar system rate limit
        now_locked, lock_sec = CyberDefense.record_failed_attempt(client_ip)
        if now_locked:
            return jsonify({
                'error': 'TooManyRequests',
                'message': f'Hoshdar: In IP be dalile 5 bar talashe eshtebah be moddate {lock_sec} sanieh ghofl shod.',
                'remaining_seconds': lock_sec
            }), 429
        return jsonify({'error': 'Unauthorized', 'message': 'Name karbari ya ramze oboor eshtebah ast'}), 401

    user = auth_result['user']
    if not user.get('is_active', 1):
        return jsonify({'error': 'Forbidden', 'message': 'In hesabe karbari gheir-faal ast'}), 403

    # Reset kardane talash-haye eshtebah bad az voroode movafagh
    CyberDefense.reset_failed_attempts(client_ip)

    token = generate_token(user)
    return jsonify({
        'token': token,
        'auth_source': auth_result.get('source', 'local'),
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role'],
            'full_name': user.get('full_name', ''),
            'permissions': Role.PERMISSIONS.get(user['role'], Role.PERMISSIONS[Role.VIEWER])
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
            'full_name': user.get('full_name', ''),
            'permissions': Role.PERMISSIONS.get(user['role'], Role.PERMISSIONS[Role.VIEWER])
        }
    })

@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    data = request.get_json() or {}
    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')

    if not User.verify_password(g.current_user['password_hash'], old_password):
        return jsonify({'error': 'Bad Request', 'message': 'Ramze oboore feli nadorost ast'}), 400

    if len(new_password) < 6:
        return jsonify({'error': 'Bad Request', 'message': 'Ramze oboore jadid bayad hadeaghal 6 character bashad'}), 400

    User.update_password(g.current_user['id'], new_password)
    return jsonify({'success': True, 'message': 'Ramze oboor ba movafaghiat be-roozresani shod'})

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
        return jsonify({'error': 'Bad Request', 'message': 'Name karbari, email va password elzami hastand'}), 400

    if role not in Role.ALL:
        return jsonify({'error': 'Bad Request', 'message': f'Naghsh namotabar ast. Mojaz: {Role.ALL}'}), 400

    try:
        user = User.create_user(username, email, password, role, full_name)
        return jsonify({'user': user, 'message': 'Karbare jadid ba movafaghiat sakhte shod'}), 201
    except Exception as e:
        return jsonify({'error': 'Conflict', 'message': f'Khata dar sakhte karbar: {str(e)}'}), 409

# ------------------------------------------------------------------------------
# Sabte-name Self-Service va Darkhast Dastresi (Access Requests)
# ------------------------------------------------------------------------------
@auth_bp.route('/access-request', methods=['POST'])
def submit_access_request():
    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip()
    department = data.get('department', '').strip()
    requested_role = data.get('requested_role', Role.OPERATOR)
    reason = data.get('reason', '').strip()

    if not full_name or not email:
        return jsonify({'error': 'Bad Request', 'message': 'Name kamel va email elzami hastand'}), 400

    req = AccessRequestModel.create_request(full_name, email, department, requested_role, reason)
    return jsonify({
        'status': 'success',
        'message': 'Darkhaste dastresi ba movafaghiat sabt shod va dar halate Pending gharar gereft.',
        'request': req
    }), 201

@auth_bp.route('/access-requests', methods=['GET'])
@admin_required
def get_access_requests():
    requests_list = AccessRequestModel.list_all()
    return jsonify({'requests': requests_list})

@auth_bp.route('/access-requests/<int:req_id>/action', methods=['POST'])
@super_admin_required
def handle_access_request(req_id: int):
    data = request.get_json() or {}
    action = data.get('action') # 'approve' ya 'reject'
    if action not in ['approve', 'reject']:
        return jsonify({'error': 'Bad Request', 'message': 'Action bayad approve ya reject bashad'}), 400

    new_status = 'approved' if action == 'approve' else 'rejected'
    AccessRequestModel.update_status(req_id, new_status)
    return jsonify({'status': 'success', 'message': f'Darkhast ba movafaghiat {new_status} shod'})
