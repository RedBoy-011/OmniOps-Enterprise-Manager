# Database Models and Helper Functions for Settings
from config.database import get_db_connection
from datetime import datetime

class ApiKeyModel:
    @classmethod
    def get_all(cls):
        conn = get_db_connection()
        rows = conn.execute('SELECT id, provider, base_url, is_active, last_validated, created_at, SUBSTR(api_key, 1, 6) || "..." || SUBSTR(api_key, -4) as masked_key FROM api_keys').fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @classmethod
    def get_by_provider(cls, provider: str):
        conn = get_db_connection()
        row = conn.execute('SELECT * FROM api_keys WHERE provider = ? AND is_active = 1 ORDER BY id DESC LIMIT 1', (provider,)).fetchone()
        conn.close()
        return dict(row) if row else None

    @classmethod
    def upsert(cls, provider: str, api_key: str, base_url: str = None):
        conn = get_db_connection()
        cursor = conn.cursor()
        existing = cursor.execute('SELECT id FROM api_keys WHERE provider = ?', (provider,)).fetchone()
        if existing:
            cursor.execute('''
                UPDATE api_keys 
                SET api_key = ?, base_url = ?, is_active = 1, last_validated = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (api_key, base_url, existing['id']))
        else:
            cursor.execute('''
                INSERT INTO api_keys (provider, api_key, base_url, is_active, last_validated)
                VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
            ''', (provider, api_key, base_url))
        conn.commit()
        conn.close()

class SystemSettingModel:
    @classmethod
    def get(cls, key: str, default: str = None):
        conn = get_db_connection()
        row = conn.execute('SELECT value FROM system_settings WHERE key = ?', (key,)).fetchone()
        conn.close()
        return row['value'] if row else default

    @classmethod
    def set(cls, key: str, value: str):
        conn = get_db_connection()
        conn.execute('''
            INSERT INTO system_settings (key, value, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        ''', (key, value))
        conn.commit()
        conn.close()
