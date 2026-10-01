# Skills Bank & Sub-Agent Registry baraye OmniOps Enterprise
# Hameye comment-haye in code be darkhaste karbar be zabane Finglish neveshte shodeand.

from flask import Blueprint, request, jsonify
from config.database import get_db_connection

skills_bp = Blueprint('skills', __name__)

SKILLS_BANK_DEFAULT = [
    {
        "id": "skill-k8s-diagnostics",
        "name_fa": "عیب‌یابی پیشرفته کلاستر و پادها",
        "name_en": "Kubernetes Deep Diagnostics",
        "description_fa": "تحلیل خودکار لاگ پادهای کرش کرده، مصرف بیش از حد CPU/RAM و عیب‌یابی شبکه CNI",
        "category": "infrastructure",
        "is_active": True,
        "sub_agent": "k8s_specialist_v2",
        "system_prompt_fa": "تو یک متخصص ارشد Kubernetes هستی. تمام خروجی‌ها را با نگاه به پایداری کلاستر تحلیل کن."
    },
    {
        "id": "skill-security-audit",
        "name_fa": "ممیزی امنیتی Zero-Trust و پورت‌ها",
        "name_en": "Zero-Trust Security Auditor",
        "description_fa": "بررسی پورت‌های باز، اعتبارسنجی گواهی‌های SSL/TLS و اسکن پیکربندی‌های آسیب‌پذیر لینوکس",
        "category": "security",
        "is_active": True,
        "sub_agent": "security_sentinel_v1",
        "system_prompt_fa": "تو یک متخصص تست نفوذ و ممیزی سیستم‌عامل‌های توزیع‌شده بر اساس استانداردهای CIS هستی."
    },
    {
        "id": "skill-database-tune",
        "name_fa": "بهینه‌سازی کوئری و ایندکس‌های دیتابیس",
        "name_en": "Database Query Optimization",
        "description_fa": "شناسایی کوئری‌های کند (Slow Queries)، بررسی Explain Analyze و پیشنهاد ایندکس‌های مرکب",
        "category": "database",
        "is_active": True,
        "sub_agent": "dba_architect_v3",
        "system_prompt_fa": "تو یک معمار دیتابیس PostgreSQL و SQLite هستی. اولویت با کاهش I/O و مصرف حافظه است."
    },
    {
        "id": "skill-wireguard-mesh",
        "name_fa": "ارکستراسیون تونل‌های مش امن WireGuard",
        "name_en": "WireGuard Mesh Orchestrator",
        "description_fa": "پیکربندی کلیدهای نامتقارن، تنظیم MTU بهینه و روترهای ریدایرکت برای ارتباط امن نودها",
        "category": "networking",
        "is_active": True,
        "sub_agent": "network_mesh_v1",
        "system_prompt_fa": "تو یک مهندس زیرساخت شبکه توزیع‌شده با تسلط بر لایه ۳ لینوکس و کریپتوگرافی نوین هستی."
    }
]

@skills_bp.route('/bank', methods=['GET'])
def list_skills():
    conn = get_db_connection()
    try:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS skills_bank (
                id TEXT PRIMARY KEY,
                name_fa TEXT NOT NULL,
                name_en TEXT NOT NULL,
                description_fa TEXT NOT NULL,
                category TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                sub_agent TEXT NOT NULL,
                system_prompt_fa TEXT NOT NULL
            )
        ''')
        rows = conn.execute('SELECT * FROM skills_bank').fetchall()
        if not rows:
            # Seed kardan ba etelaat pishfarz
            for s in SKILLS_BANK_DEFAULT:
                conn.execute('''
                    INSERT OR REPLACE INTO skills_bank (id, name_fa, name_en, description_fa, category, is_active, sub_agent, system_prompt_fa)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (s['id'], s['name_fa'], s['name_en'], s['description_fa'], s['category'], 1 if s['is_active'] else 0, s['sub_agent'], s['system_prompt_fa']))
            conn.commit()
            rows = conn.execute('SELECT * FROM skills_bank').fetchall()
        return jsonify({'skills': [dict(r) for r in rows]})
    finally:
        conn.close()

@skills_bp.route('/bank/<skill_id>/toggle', methods=['POST'])
def toggle_skill(skill_id: str):
    conn = get_db_connection()
    try:
        row = conn.execute('SELECT is_active FROM skills_bank WHERE id = ?', (skill_id,)).fetchone()
        if not row:
            return jsonify({'error': 'NotFound', 'message': 'Skill peyda nashod'}), 404
        new_val = 0 if row['is_active'] else 1
        conn.execute('UPDATE skills_bank SET is_active = ? WHERE id = ?', (new_val, skill_id))
        conn.commit()
        return jsonify({'status': 'success', 'is_active': bool(new_val)})
    finally:
        conn.close()
