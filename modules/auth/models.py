# Auth Models for OmniOps Enterprise
import hashlib
import secrets
from datetime import datetime
from config.database import get_db_connection

class Role:
    SUPER_ADMIN = "SuperAdmin"
    ADMIN = "Admin"
    USER = "User"
    
    ALL = [SUPER_ADMIN, ADMIN, USER]

class User:
    @staticmethod
    def hash_password(password: str) -> str:
        # Simple secure salt & SHA256 for portable python environment without external heavy bcrypt
        salt = "omniops_salt_2026_"
        return hashlib.sha256((salt + password).encode('utf-8')).hexdigest()

    @staticmethod
    def verify_password(stored_hash: str, provided_password: str) -> bool:
        return stored_hash == User.hash_password(provided_password)

    @classmethod
    def get_by_id(cls, user_id: int):
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        conn.close()
        return dict(user) if user else None

    @classmethod
    def get_by_username(cls, username: str):
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        conn.close()
        return dict(user) if user else None

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
    def list_all(cls):
        conn = get_db_connection()
        users = conn.execute('SELECT id, username, email, role, full_name, is_active, created_at, last_login FROM users ORDER BY id ASC').fetchall()
        conn.close()
        return [dict(u) for u in users]
