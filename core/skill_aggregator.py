"""
Skill Aggregator & Auto-Translation Pipeline (skill_aggregator.py)
------------------------------------------------------------------
پل ارتباطی میان مخازن مهارت خارجی (Skillry.dev) و دیتابیس SQLite سیستم:
1. Fetch & Auto-Translate Pipeline با استفاده از LLM در پس‌زمینه (Background Async Thread)
2. SQLite Caching در جدول marketplace_skills جهت جلوگیری از مصرف توکن
3. Flask Endpoints برای لیست کردن مهارت‌ها و فعال‌سازی توسط ادمین جهت تزریق به System Prompt
"""

import sqlite3
import json
import threading
import urllib.request
import urllib.error
from flask import Blueprint, request, jsonify
from config.database import get_db_connection

skill_aggregator_bp = Blueprint('skill_aggregator', __name__)

class SkillMarketplace:
    def __init__(self):
        self.init_marketplace_db()

    def init_marketplace_db(self):
        """ایجاد جدول marketplace_skills در صورت عدم وجود"""
        try:
            with get_db_connection() as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS marketplace_skills (
                        id TEXT PRIMARY KEY,
                        name_en TEXT NOT NULL,
                        name_fa TEXT,
                        description_en TEXT,
                        description_fa TEXT,
                        system_prompt TEXT,
                        is_premium INTEGER DEFAULT 0,
                        is_enabled INTEGER DEFAULT 0,
                        translated INTEGER DEFAULT 0
                    )
                """)
                conn.commit()
        except Exception as e:
            print(f"[-] Error initializing marketplace_skills table: {e}")

    def fetch_remote_skills(self) -> list:
        """شبیه‌سازی دریافت لیست مهارت‌های انگلیسی از منابع خارجی (مانند Skillry.dev)"""
        return [
            {
                "id": "skill-net-audit",
                "name": "Advanced Network Auditor",
                "description": "Scans local subnet ports, inspects MikroTik firewall rules and diagnoses network bottlenecks.",
                "system_prompt": "You are a Senior Network Security Expert. Always check firewall rules and output structured logs.",
                "is_premium": 0
            },
            {
                "id": "skill-k8s-ops",
                "name": "Kubernetes Cluster Healer",
                "description": "Inspects pod crash loops, checks ingress controller configs and automatically applies patch manifests.",
                "system_prompt": "You are a Kubernetes Master SRE. Diagnose pod errors and provide kubectl remediation commands.",
                "is_premium": 1
            },
            {
                "id": "skill-python-refactor",
                "name": "Python Clean Code Architect",
                "description": "Refactors legacy Python scripts, enforces PEP8 standards and adds robust exception handling.",
                "system_prompt": "You are a Principal Python Architect. Write clean, modular, typed Python code with robust docstrings.",
                "is_premium": 0
            }
        ]

    def translate_text_to_fa(self, text: str) -> str:
        """ترجمه هوشمند متن انگلیسی به فارسی تخصصی با استفاده از مدل زبانی"""
        # In a real environment, calls Gemini / model manager. Here we simulate / provide specialized translation.
        translations = {
            "Advanced Network Auditor": "ممیز پیشرفته شبکه",
            "Scans local subnet ports, inspects MikroTik firewall rules and diagnoses network bottlenecks.": "پورت‌های زیرشبکه محلی را اسکن کرده، قوانین فایروال میکروتیک را بررسی و گلوگاه‌های شبکه را عارضه‌یابی می‌کند.",
            "Kubernetes Cluster Healer": "متخصص عارضه‌یابی و درمان کلاستر کوبرنتیز",
            "Inspects pod crash loops, checks ingress controller configs and automatically applies patch manifests.": "حلقه‌های خرابی پادها را بررسی کرده و مانیفست‌های اصلاحی را اعمال می‌کند.",
            "Python Clean Code Architect": "معمار کد تمیز پایتون",
            "Refactors legacy Python scripts, enforces PEP8 standards and adds robust exception handling.": "اسکریپت‌های پایتون را بازسازی کرده، استانداردهای PEP8 را اعمال و مدیریت خطای پیشرفته اضافه می‌کند."
        }
        return translations.get(text, text)

    def sync_and_translate_skills(self):
        """سینک کردن مهارت‌ها و ترجمه در پس‌زمینه (Background Async Translation)"""
        remote_skills = self.fetch_remote_skills()
        with get_db_connection() as conn:
            cursor = conn.cursor()
            for skill in remote_skills:
                cursor.execute("SELECT id, translated FROM marketplace_skills WHERE id = ?", (skill['id'],))
                row = cursor.fetchone()
                
                if not row:
                    # Insert English data first
                    name_fa = self.translate_text_to_fa(skill['name'])
                    desc_fa = self.translate_text_to_fa(skill['description'])
                    cursor.execute("""
                        INSERT INTO marketplace_skills (id, name_en, name_fa, description_en, description_fa, system_prompt, is_premium, is_enabled, translated)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1)
                    """, (skill['id'], skill['name'], name_fa, skill['description'], desc_fa, skill['system_prompt'], skill['is_premium']))
            conn.commit()

    def start_background_sync(self):
        """اجرای همگام‌سازی و ترجمه در یک Thread مجزا در پس‌زمینه"""
        thread = threading.Thread(target=self.sync_and_translate_skills, daemon=True)
        thread.start()

marketplace = SkillMarketplace()

@skill_aggregator_bp.route('/marketplace', methods=['GET'])
def get_marketplace_skills():
    """ارائه لیست مهارت‌های ترجمه‌شده به فرانت‌اند"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, name_fa, description_fa, is_premium, is_enabled FROM marketplace_skills")
            rows = cursor.fetchall()
            skills = []
            for r in rows:
                skills.append({
                    'id': r[0],
                    'name': r[1],
                    'description': r[2],
                    'is_premium': bool(r[3]),
                    'is_enabled': bool(r[4])
                })
            return jsonify({'success': True, 'skills': skills})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@skill_aggregator_bp.route('/marketplace/toggle', methods=['POST'])
def toggle_skill_status():
    """فعال‌سازی یا غیرفعال‌سازی مهارت توسط ادمین جهت تزریق به System Prompt"""
    try:
        data = request.get_json()
        skill_id = data.get('skill_id')
        enable = int(data.get('enable', 0))

        with get_db_connection() as conn:
            conn.execute("UPDATE marketplace_skills SET is_enabled = ? WHERE id = ?", (enable, skill_id))
            conn.commit()
        return jsonify({'success': True, 'message': f'Skill {skill_id} updated successfully.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
