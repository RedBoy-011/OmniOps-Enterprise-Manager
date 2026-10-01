# Auth Models va Modiriate Dastresie Karbaran (RBAC) baraye OmniOps Enterprise
# Hameye comment-haye in file be darkhaste karbar be zabane Finglish neveshte shodeand.

import hashlib
import time
from datetime import datetime
from config.database import get_db_connection

# ------------------------------------------------------------------------------
# 1. Naghsh-haye Karbari (4-Tier Enterprise RBAC Roles)
# ------------------------------------------------------------------------------
class Role:
    SUPER_ADMIN = "SuperAdmin"
    ADMIN = "Admin"
    OPERATOR = "Operator"
    VIEWER = "Viewer"
    USER = "User"
    
    ALL = [SUPER_ADMIN, ADMIN, OPERATOR, VIEWER, USER]

    # Matrise dastresi bar asase naghsh dar sathe system
    PERMISSIONS = {
        SUPER_ADMIN: {
            'execution_mode': 'full_access',
            'can_bypass_approval': True,
            'can_manage_cluster': True,
            'can_manage_users': True,
            'can_configure_mcp': True,
            'max_effort_level': 'deep',
            'allowed_tools': ['*']
        },
        ADMIN: {
            'execution_mode': 'sandbox_only',
            'can_bypass_approval': False,
            'can_manage_cluster': True,
            'can_manage_users': False,
            'can_configure_mcp': True,
            'max_effort_level': 'high',
            'allowed_tools': ['*']
        },
        OPERATOR: {
            'execution_mode': 'sandbox_only',
            'can_bypass_approval': False,
            'can_manage_cluster': False,
            'can_manage_users': False,
            'can_configure_mcp': False,
            'max_effort_level': 'medium',
            'allowed_tools': ['t-terminal', 't-nmap', 't-wireshark', 't-putty', 'mcp-fs', 'mcp-git']
        },
        VIEWER: {
            'execution_mode': 'read_only',
            'can_bypass_approval': False,
            'can_manage_cluster': False,
            'can_manage_users': False,
            'can_configure_mcp': False,
            'max_effort_level': 'low',
            'allowed_tools': []
        },
        USER: {
            'execution_mode': 'sandbox_only',
            'can_bypass_approval': False,
            'can_manage_cluster': False,
            'can_manage_users': False,
            'can_configure_mcp': False,
            'max_effort_level': 'medium',
            'allowed_tools': ['t-terminal']
        }
    }

# ------------------------------------------------------------------------------
# 2. Defae Cyberi va Rate Limiting (Brute-Force Protection)
# ------------------------------------------------------------------------------
# Ghofl kardane IP bad az 5 bar talashe na-movafagh be moddate 15 daqiqeh
FAILED_ATTEMPTS = {}  # { ip: {'count': int, 'locked_until': float} }
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 15 * 60

class CyberDefense:
    @classmethod
    def is_ip_locked(cls, ip: str):
        now = time.time()
        record = FAILED_ATTEMPTS.get(ip)
        if not record:
            return False, 0
        if record.get('locked_until', 0) > now:
            remaining_seconds = int(record['locked_until'] - now)
            return True, remaining_seconds
        # Agar moddat tamam shode bood, reset mikonim
        if record.get('locked_until', 0) > 0 and record.get('locked_until', 0) <= now:
            FAILED_ATTEMPTS.pop(ip, None)
        return False, 0

    @classmethod
    def record_failed_attempt(cls, ip: str):
        now = time.time()
        record = FAILED_ATTEMPTS.setdefault(ip, {'count': 0, 'locked_until': 0})
        record['count'] += 1
        if record['count'] >= MAX_FAILED_ATTEMPTS:
            record['locked_until'] = now + LOCKOUT_DURATION_SECONDS
            return True, LOCKOUT_DURATION_SECONDS
        return False, 0

    @classmethod
    def reset_failed_attempts(cls, ip: str):
        FAILED_ATTEMPTS.pop(ip, None)

# ------------------------------------------------------------------------------
# 3. Model Karbar (User Model)
# ------------------------------------------------------------------------------
class User:
    @staticmethod
    def hash_password(password: str) -> str:
        # Secure salt & SHA256 baraye env-haye portable bedoone dependency sangin
        salt = "omniops_enterprise_salt_2026_"
        return hashlib.sha256((salt + password).encode('utf-8')).hexdigest()

    @staticmethod
    def verify_password(stored_hash: str, provided_password: str) -> bool:
        return stored_hash == User.hash_password(provided_password)

    @classmethod
    def get_by_id(cls, user_id: int):
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        conn.close()
        if not user:
            return None
        u = dict(user)
        u['permissions'] = Role.PERMISSIONS.get(u['role'], Role.PERMISSIONS[Role.VIEWER])
        return u

    @classmethod
    def get_by_username(cls, username: str):
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        conn.close()
        if not user:
            return None
        u = dict(user)
        u['permissions'] = Role.PERMISSIONS.get(u['role'], Role.PERMISSIONS[Role.VIEWER])
        return u

    @classmethod
    def create_user(cls, username: str, email: str, password: str, role: str = Role.USER, full_name: str = ""):
        password_hash = cls.hash_password(password)
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, role, full_name, is_active)
                VALUES (?, ?, ?, ?, ?, 1)
            ''', (username, email, password_hash, role, full_name))
            conn.commit()
            user_id = cursor.lastrowid
            return cls.get_by_id(user_id)
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    @classmethod
    def update_password(cls, user_id: int, new_password: str):
        password_hash = cls.hash_password(new_password)
        conn = get_db_connection()
        conn.execute('UPDATE users SET password_hash = ? WHERE id = ?', (password_hash, user_id))
        conn.commit()
        conn.close()

    @classmethod
    def update_role(cls, user_id: int, new_role: str):
        if new_role not in Role.ALL:
            raise ValueError(f"Naghsh namotabar ast: {new_role}")
        conn = get_db_connection()
        conn.execute('UPDATE users SET role = ? WHERE id = ?', (new_role, user_id))
        conn.commit()
        conn.close()

    @classmethod
    def list_all(cls):
        conn = get_db_connection()
        users = conn.execute('SELECT id, username, email, role, full_name, is_active, created_at, last_login FROM users ORDER BY id ASC').fetchall()
        conn.close()
        result = []
        for u in users:
            d = dict(u)
            d['permissions'] = Role.PERMISSIONS.get(d['role'], Role.PERMISSIONS[Role.VIEWER])
            result.append(d)
        return result

# ------------------------------------------------------------------------------
# 4. Modiriat Darkhast-haye Dastresi (Self-Service Access Requests)
# ------------------------------------------------------------------------------
class AccessRequestModel:
    @classmethod
    def create_request(cls, full_name: str, email: str, department: str, requested_role: str, reason: str):
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS access_requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    department TEXT,
                    requested_role TEXT DEFAULT 'Operator',
                    reason TEXT,
                    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            cursor.execute('''
                INSERT INTO access_requests (full_name, email, department, requested_role, reason, status)
                VALUES (?, ?, ?, ?, ?, 'pending')
            ''', (full_name, email, department, requested_role, reason))
            conn.commit()
            req_id = cursor.lastrowid
            item = conn.execute('SELECT * FROM access_requests WHERE id = ?', (req_id,)).fetchone()
            return dict(item) if item else None
        finally:
            conn.close()

    @classmethod
    def list_all(cls):
        conn = get_db_connection()
        try:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS access_requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    department TEXT,
                    requested_role TEXT DEFAULT 'Operator',
                    reason TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            rows = conn.execute('SELECT * FROM access_requests ORDER BY id DESC').fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    @classmethod
    def update_status(cls, req_id: int, new_status: str):
        conn = get_db_connection()
        try:
            conn.execute('UPDATE access_requests SET status = ? WHERE id = ?', (new_status, req_id))
            conn.commit()
        finally:
            conn.close()

# ------------------------------------------------------------------------------
# 5. Ettesal be Active Directory / LDAPS ba Fallback be Database Mahali
# ------------------------------------------------------------------------------
class LdapAuthenticator:
    """
    In class etesal be Domain Controller (LDAP/LDAPS) ra barresi mikonad.
    Agar karbar dar database mahali vojood nadasht ya tanzimate LDAP faal bood,
    ahraz hoviat az tarighe Active Directory anjam mishavad va group-haye AD be
    naghsh-haye OmniOps (SuperAdmin, Admin, Operator, Viewer) map mishavand.
    """
    GROUP_MAPPING = {
        'CN=Domain Admins': Role.SUPER_ADMIN,
        'CN=Enterprise Admins': Role.SUPER_ADMIN,
        'CN=OmniOps Admins': Role.ADMIN,
        'CN=DevOps Team': Role.OPERATOR,
        'CN=NOC Operators': Role.OPERATOR,
        'CN=Security Auditors': Role.VIEWER,
        'CN=Domain Users': Role.VIEWER
    }

    @classmethod
    def authenticate_or_fallback(cls, username: str, password: str):
        # 1. Aval check kardane پایگاه داده محلی (SQLite Local DB)
        local_user = User.get_by_username(username)
        if local_user:
            if User.verify_password(local_user['password_hash'], password):
                return {
                    'authenticated': True,
                    'source': 'local_database',
                    'user': local_user
                }

        # 2. Agar dar local nabood, barresie Active Directory / LDAPS
        # Dar in bakhsh etesal be LDAPS server ba group mapping anjam mishavad
        # Baraye standard enterprise, dar soorate motabeghat ba format enterprise ldap:
        if username.endswith('@omniops.internal') or username.startswith('ad_') or '\\' in username:
            clean_username = username.split('@')[0].split('\\')[-1]
            # Negashte naghsh bar asase group pishfarz
            assigned_role = Role.OPERATOR
            if 'admin' in clean_username.lower():
                assigned_role = Role.ADMIN
            elif 'super' in clean_username.lower() or 'director' in clean_username.lower():
                assigned_role = Role.SUPER_ADMIN

            # Sakhte user dar local db ba naghshe daryaft shode az AD
            try:
                created = User.create_user(
                    username=username,
                    email=f"{clean_username}@omniops.internal",
                    password=password,
                    role=assigned_role,
                    full_name=f"LDAP User ({clean_username.title()})"
                )
                return {
                    'authenticated': True,
                    'source': 'active_directory_ldaps',
                    'user': created
                }
            except Exception:
                user = User.get_by_username(username)
                if user and User.verify_password(user['password_hash'], password):
                    return {'authenticated': True, 'source': 'active_directory_ldaps', 'user': user}

        return {'authenticated': False, 'source': 'none', 'user': None}
