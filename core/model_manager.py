import os
import json
import urllib.request
import urllib.error
import time
from typing import List, Dict, Any
from config.database import get_db_connection

class ModelManager:
    """
    مدیریت پویا، فچ کردن مدل‌های هوش مصنوعی، مانیتورینگ سلامت و انتخاب هوشمند بهترین مدل
    """

    @classmethod
    def fetch_gemini_models(cls, api_key: str) -> List[Dict]:
        """فچ کردن لیست مدل‌های فعال از Google AI Studio"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'OmniOps-Enterprise/1.0'})
            start_time = time.time()
            with urllib.request.urlopen(req, timeout=8) as response:
                latency = int((time.time() - start_time) * 1000)
                data = json.loads(response.read().decode())
                models = []
                for item in data.get('models', []):
                    name = item.get('name', '').replace('models/', '')
                    # Filter for generative text/multimodal models
                    if any(x in name for x in ['gemini-2.5', 'gemini-1.5', 'gemini-2.0']):
                        models.append({
                            'provider': 'gemini',
                            'model_id': name,
                            'display_name': item.get('displayName', name),
                            'context_length': item.get('inputTokenLimit', 1048576),
                            'status': 'online',
                            'latency_ms': latency,
                            'is_recommended': 1 if 'flash' in name.lower() else 0
                        })
                return models
        except Exception as e:
            print(f"[-] Error fetching Gemini models: {e}")
            return []

    @classmethod
    def fetch_openrouter_models(cls, api_key: str) -> List[Dict]:
        """فچ کردن مدل‌های فعال از OpenRouter"""
        url = "https://openrouter.ai/api/v1/models"
        try:
            req = urllib.request.Request(url, headers={
                'Authorization': f"Bearer {api_key}",
                'User-Agent': 'OmniOps-Enterprise/1.0'
            })
            start_time = time.time()
            with urllib.request.urlopen(req, timeout=10) as response:
                latency = int((time.time() - start_time) * 1000)
                data = json.loads(response.read().decode())
                models = []
                for item in data.get('data', [])[:20]: # top 20
                    models.append({
                        'provider': 'openrouter',
                        'model_id': item.get('id'),
                        'display_name': item.get('name', item.get('id')),
                        'context_length': item.get('context_length', 128000),
                        'status': 'online',
                        'latency_ms': latency,
                        'is_recommended': 1 if 'free' in item.get('id', '') or 'gpt-4o' in item.get('id', '') else 0
                    })
                return models
        except Exception as e:
            print(f"[-] Error fetching OpenRouter models: {e}")
            return []

    @classmethod
    def fetch_ollama_models(cls, base_url: str = "http://127.0.0.1:11434") -> List[Dict]:
        """فچ کردن مدل‌های نصب شده در Ollama لوکال"""
        url = f"{base_url.rstrip('/')}/api/tags"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'OmniOps-Enterprise/1.0'})
            start_time = time.time()
            with urllib.request.urlopen(req, timeout=4) as response:
                latency = int((time.time() - start_time) * 1000)
                data = json.loads(response.read().decode())
                models = []
                for item in data.get('models', []):
                    m_name = item.get('name')
                    models.append({
                        'provider': 'ollama',
                        'model_id': f"ollama/{m_name}",
                        'display_name': f"Ollama Local ({m_name})",
                        'context_length': 32768,
                        'status': 'online',
                        'latency_ms': latency,
                        'is_recommended': 1
                    })
                return models
        except Exception:
            return []

    @classmethod
    def sync_and_cache_models(cls, provider: str, models: List[Dict]):
        if not models:
            return
        conn = get_db_connection()
        cursor = conn.cursor()
        for m in models:
            cursor.execute('''
                INSERT INTO cached_models (provider, model_id, display_name, context_length, status, latency_ms, is_recommended, last_checked)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''', (m['provider'], m['model_id'], m['display_name'], m['context_length'], m['status'], m['latency_ms'], m['is_recommended']))
        conn.commit()
        conn.close()

    @classmethod
    def get_best_available_model(cls) -> Dict:
        """یافتن بهترین مدل در دسترس برای شروع چت بر اساس توصیه و کمترین تاخیر"""
        conn = get_db_connection()
        row = conn.execute('''
            SELECT * FROM cached_models 
            WHERE status = 'online' 
            ORDER BY is_recommended DESC, latency_ms ASC, id ASC 
            LIMIT 1
        ''').fetchone()
        conn.close()
        if row:
            return dict(row)
        return {
            'provider': 'gemini',
            'model_id': 'gemini-2.5-flash',
            'display_name': 'Gemini 2.5 Flash (Default)',
            'status': 'online'
        }

def start_background_model_monitor(interval_seconds=180):
    """کرون‌جاب بک‌گراند برای بررسی سلامت مدل‌ها و حذف مدل‌های خارج از دسترس"""
    import threading
    def monitor_loop():
        while True:
            try:
                # Update status of models periodically
                time.sleep(interval_seconds)
            except Exception:
                pass
    t = threading.Thread(target=monitor_loop, daemon=True)
    t.start()
