from flask import Blueprint, request, jsonify
from modules.settings.models import ApiKeyModel, SystemSettingModel
from modules.auth.decorators import login_required, admin_required
from core.model_manager import ModelManager
from core.proxy_manager import ProxyManager

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/keys', methods=['GET'])
@admin_required
def get_api_keys():
    keys = ApiKeyModel.get_all()
    # Provide direct acquisition links
    provider_links = {
        'gemini': 'https://aistudio.google.com/app/apikey',
        'openrouter': 'https://openrouter.ai/keys',
        'ollama': 'http://localhost:11434'
    }
    return jsonify({
        'keys': keys,
        'official_links': provider_links
    })

@settings_bp.route('/keys', methods=['POST'])
@admin_required
def save_api_key():
    data = request.get_json() or {}
    provider = data.get('provider')
    api_key = data.get('api_key', '').strip()
    base_url = data.get('base_url')

    if not provider or not api_key:
        return jsonify({'error': 'Bad Request', 'message': 'ارائه‌دهنده و کلید API الزامی هستند'}), 400

    ApiKeyModel.upsert(provider, api_key, base_url)
    return jsonify({'success': True, 'message': f'کلید API ارائه‌دهنده {provider} با موفقیت ذخیره شد'})

@settings_bp.route('/fetch-models', methods=['POST'])
@admin_required
def test_and_fetch_models():
    """تست ارتباط با سرور هوش مصنوعی و واکشی زنده لیست مدل‌ها"""
    data = request.get_json() or {}
    provider = data.get('provider')

    key_record = ApiKeyModel.get_by_provider(provider) if provider else None
    api_key = data.get('api_key') or (key_record['api_key'] if key_record else None)

    fetched_models = []
    if provider == 'gemini':
        if not api_key:
            return jsonify({'success': False, 'message': 'کلید Gemini یافت نشد'}), 400
        fetched_models = ModelManager.fetch_gemini_models(api_key)
    elif provider == 'openrouter':
        if not api_key:
            return jsonify({'success': False, 'message': 'کلید OpenRouter یافت نشد'}), 400
        fetched_models = ModelManager.fetch_openrouter_models(api_key)
    elif provider == 'ollama':
        base_url = data.get('base_url') or (key_record['base_url'] if key_record else "http://127.0.0.1:11434")
        fetched_models = ModelManager.fetch_ollama_models(base_url)

    if fetched_models:
        ModelManager.sync_and_cache_models(provider, fetched_models)
        return jsonify({
            'success': True,
            'count': len(fetched_models),
            'models': fetched_models,
            'message': f'{len(fetched_models)} مدل فعال با موفقیت واکشی و در دیتابیس ثبت شد'
        })
    else:
        return jsonify({
            'success': False,
            'message': 'خطا در ارتباط با سرور یا کلید نامعتبر است (در صورت لزوم پراکسی SOCKS5 را بررسی کنید)'
        }), 400

@settings_bp.route('/proxy', methods=['GET', 'POST'])
@admin_required
def proxy_settings():
    if request.method == 'GET':
        return jsonify(ProxyManager.get_proxy_settings())
    
    data = request.get_json() or {}
    enabled = str(data.get('enabled', False)).lower()
    host = data.get('host', '127.0.0.1').strip()
    port = str(data.get('port', 1080)).strip()

    SystemSettingModel.set('socks5_enabled', enabled)
    SystemSettingModel.set('socks5_host', host)
    SystemSettingModel.set('socks5_port', port)

    # Test connection
    test_res = ProxyManager.test_proxy(host, int(port)) if enabled == 'true' else {'success': True, 'message': 'پراکسی غیرفعال شد'}

    return jsonify({
        'success': True,
        'message': 'تنظیمات پراکسی ذخیره شد',
        'test': test_res
    })

@settings_bp.route('/github', methods=['GET', 'POST'])
@admin_required
def github_settings():
    if request.method == 'GET':
        return jsonify({
            'repo_url': SystemSettingModel.get('github_repo_url', 'https://github.com/omniops/omniops-enterprise'),
            'current_version': '1.0.0',
            'latest_commit': 'Initial Enterprise Release'
        })
    
    data = request.get_json() or {}
    repo_url = data.get('repo_url', '').strip()
    if repo_url:
        SystemSettingModel.set('github_repo_url', repo_url)
    return jsonify({'success': True, 'message': 'آدرس ریپازیتوری گیت‌هاب به‌روزرسانی شد'})
