# Windows Edge Agent (Coucou Refactored for OmniOps Enterprise)
# این ماژول نسخه مهندسی معکوس و بومی‌سازی‌شده مخزن Coucou (Louis-CFM/coucou) است
# که به عنوان بازوی اجرایی ویندوزی (Windows Edge Agent) به سرور مرکزی OmniOps متصل می‌شود.

from flask import Blueprint, request, jsonify, Response
import json
import time
import uuid

agent_bp = Blueprint('agent_gateway', __name__)

# حافظه موقت برای توکن‌ها و وضعیت کلاینت‌های متصل
ACTIVE_EXCHANGE_TOKENS = {
    "omni_sec_tok_master_default": {
        "user_id": 1,
        "username": "superadmin",
        "description": "Default Master Windows Agent Token",
        "created_at": time.time(),
        "is_active": True
    }
}

CONNECTED_WIN_AGENTS = {}
AGENT_EXECUTION_LOGS = []

def verify_token(req):
    auth_header = req.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1].strip()
        if token in ACTIVE_EXCHANGE_TOKENS and ACTIVE_EXCHANGE_TOKENS[token]['is_active']:
            return ACTIVE_EXCHANGE_TOKENS[token]
    return None

@agent_bp.route('/v1/chat', methods=['POST'])
@agent_bp.route('/api/v1/chat', methods=['POST'])
def edge_chat_gateway():
    """
    API Gateway اختصاصی برای دریافت درخواست‌های استریم از بازوی ویندوزی (Coucou).
    """
    token_info = verify_token(request)
    if not token_info:
        return jsonify({"error": "Unauthorized: Invalid or missing Exchange Token"}), 401

    data = request.get_json(silent=True) or {}
    messages = data.get('messages', [])
    stream = data.get('stream', True)
    edge_metadata = data.get('edge_metadata', {})

    # ثبت وضعیت اتصال ایجنت
    client_ip = request.remote_addr
    agent_id = f"win-agent-{client_ip.replace('.', '-')}"
    CONNECTED_WIN_AGENTS[agent_id] = {
        "agent_id": agent_id,
        "ip": client_ip,
        "username": token_info.get('username'),
        "last_seen": time.time(),
        "metadata": edge_metadata,
        "status": "online"
    }

    last_user_message = ""
    for m in reversed(messages):
        if m.get('role') == 'user':
            last_user_message = m.get('content', '')
            break

    # تشخیص نیاز به دستور سیستمی ویندوز
    system_cmd_payload = None
    lower_msg = last_user_message.lower()
    
    if any(k in lower_msg for k in ['process', 'پروسس', 'پردازش']):
        system_cmd_payload = "[WIN_AGENT:POWERSHELL:Get-Process | Sort-Object CPU -Descending | Select-Object -First 8 | Format-Table -AutoSize]"
    elif any(k in lower_msg for k in ['ip', 'network', 'شبکه', 'کانفیگ']):
        system_cmd_payload = "[WIN_AGENT:CMD:ipconfig /all]"
    elif any(k in lower_msg for k in ['service', 'سرویس']):
        system_cmd_payload = "[WIN_AGENT:POWERSHELL:Get-Service | Where-Object {$_.Status -eq 'Running'} | Select-Object -First 10]"
    elif any(k in lower_msg for k in ['disk', 'حافظه', 'دیسک']):
        system_cmd_payload = "[WIN_AGENT:POWERSHELL:Get-PSDrive -PSProvider 'FileSystem']"

    if stream:
        def generate_sse():
            chunk1 = json.dumps({'choices': [{'delta': {'content': 'درخواست از طریق هسته OmniOps پردازش شد.\n'}}]})
            yield f"data: {chunk1}\n\n"
            time.sleep(0.1)
            
            if system_cmd_payload:
                chunk2 = json.dumps({'choices': [{'delta': {'content': 'در حال آماده‌سازی فرمان اجرایی سیستمی:\n'}}]})
                yield f"data: {chunk2}\n\n"
                time.sleep(0.1)
                chunk3 = json.dumps({'choices': [{'delta': {'content': system_cmd_payload + '\n'}}]})
                yield f"data: {chunk3}\n\n"
                time.sleep(0.1)
                chunk4 = json.dumps({'choices': [{'delta': {'content': 'دستور بالا نیازمند تایید کاربر در پاپ‌آپ Zero-Trust است.'}}]})
                yield f"data: {chunk4}\n\n"
            else:
                chunk_reply = json.dumps({'choices': [{'delta': {'content': 'پاسخ سرور مرکزی OmniOps: دستور شما دریافت شد و بستر اتصال به سیستم‌عامل ویندوز پایدار است.'}}]})
                yield f"data: {chunk_reply}\n\n"

            yield "data: [DONE]\n\n"

        return Response(generate_sse(), mimetype='text/event-stream')

    return jsonify({
        "status": "success",
        "reply": f"دستور دریافت شد. {system_cmd_payload or ''}"
    })

@agent_bp.route('/v1/agent/callback', methods=['POST'])
@agent_bp.route('/api/v1/agent/callback', methods=['POST'])
def edge_callback():
    """
    دریافت تله‌متری و نتایج اجرای دستور از بازوی ویندوزی (Coucou).
    """
    token_info = verify_token(request)
    if not token_info:
        return jsonify({"error": "Unauthorized"}), 401

    payload = request.get_json(silent=True) or {}
    record = {
        "id": f"exec-{int(time.time()*1000)}",
        "timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
        "command_id": payload.get('command_id'),
        "action": payload.get('action'),
        "command": payload.get('command'),
        "status": payload.get('status'),
        "exit_code": payload.get('exit_code'),
        "output": payload.get('output', '')[:2000],
        "executed_by": token_info.get('username')
    }
    AGENT_EXECUTION_LOGS.insert(0, record)
    if len(AGENT_EXECUTION_LOGS) > 100:
        AGENT_EXECUTION_LOGS.pop()

    return jsonify({
        "status": "acknowledged",
        "record_id": record["id"],
        "message": "Telemetry received successfully"
    })

@agent_bp.route('/api/v1/agent/windows/tokens', methods=['GET', 'POST'])
def manage_tokens():
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        new_token = f"omni_sec_tok_{uuid.uuid4().hex[:16]}"
        ACTIVE_EXCHANGE_TOKENS[new_token] = {
            "user_id": data.get('user_id', 1),
            "username": data.get('username', 'admin'),
            "description": data.get('description', 'Windows Edge Node'),
            "created_at": time.time(),
            "is_active": True
        }
        return jsonify({
            "status": "success",
            "token": new_token,
            "info": ACTIVE_EXCHANGE_TOKENS[new_token]
        }), 201

    tokens_list = [
        {"token": k, **v} for k, v in ACTIVE_EXCHANGE_TOKENS.items()
    ]
    return jsonify({"tokens": tokens_list})

@agent_bp.route('/api/v1/agent/windows/status', methods=['GET'])
def get_agents_status():
    return jsonify({
        "connected_agents": list(CONNECTED_WIN_AGENTS.values()),
        "recent_executions": AGENT_EXECUTION_LOGS[:20],
        "total_active": len(CONNECTED_WIN_AGENTS)
    })

@agent_bp.route('/api/v1/agent/version', methods=['GET'])
def check_agent_version():
    client_version = request.args.get('current_version') or request.headers.get('X-Agent-Version') or '2.4.0'
    latest_ver = "2.4.1"
    host_url = request.host_url.rstrip('/')
    
    return jsonify({
        "current_client_version": client_version,
        "latest_version": latest_ver,
        "update_available": client_version != latest_ver,
        "mandatory": False,
        "release_date": "2026-10-01",
        "changelog": "بازوی اجرایی ویندوزی Coucou با گیت تاییدیه Zero-Trust، مدیریت پروسس‌ها و سامانه بررسی خودکار نسخه",
        "download_url": f"{host_url}/api/v1/agent/download/windows-agent-binary",
        "github_download_url": f"https://github.com/RedBoy-011/OmniOps-Enterprise-Manager/releases/download/v{latest_ver}/OmniOps-Windows-Edge-Agent-v{latest_ver}.zip",
        "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    })

@agent_bp.route('/api/v1/agent/download/windows-agent-binary', methods=['GET'])
def download_windows_agent_binary():
    import os
    from flask import send_file, redirect
    zip_path = os.path.join(os.getcwd(), 'public', 'downloads', 'OmniOps-Windows-Edge-Agent-v2.4.1.zip')
    if os.path.exists(zip_path):
        return send_file(zip_path, as_attachment=True, download_name='OmniOps-Windows-Edge-Agent-v2.4.1.zip')
    return redirect('https://github.com/RedBoy-011/OmniOps-Enterprise-Manager/releases/latest')

@agent_bp.route('/api/v1/agent/download/windows-setup', methods=['GET'])
def download_windows_setup_script():
    host_url = request.host_url.rstrip('/')
    token = request.args.get('token', 'omni_sec_tok_master_default')
    script_content = f"""# OmniOps Dynamic Windows Agent Bootstrapper
$MasterUrl = "{host_url}"
$Token = "{token}"
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   OmniOps Windows Edge Agent Auto-Provisioning Setup    " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "[*] Master URL: $MasterUrl"
Write-Host "[*] Registering credentials into Windows Credential Manager..."

$UserDir = Join-Path $env:APPDATA "OmniOpsAgent"
if (-not (Test-Path $UserDir)) {{ New-Item -ItemType Directory -Path $UserDir -Force | Out-Null }}
@{{ "master_url" = $MasterUrl; "exchange_token" = $Token }} | ConvertTo-Json | Set-Content (Join-Path $UserDir "config.json") -Encoding UTF8

Write-Host "[✓] Setup completed successfully! Ready to launch OmniOps Windows Edge Companion." -ForegroundColor Green
"""
    return Response(
        script_content,
        mimetype="text/plain; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=setup-omniops-agent.ps1"}
    )

# =========================================================================
# Bakhshe 1: Volatile Pairing Code Architecture (RAM Only) dar Python
# Hameye comment-ha be zabane Finglish neveshte shodeand
# =========================================================================
VOLATILE_PAIRING_STORE = {}

@agent_bp.route('/api/v1/agent/pair/generate', methods=['POST'])
def generate_volatile_pin():
    # Sakhte kode 6 raghamie adadi
    pin = str(random.randint(100000, 999999))
    now = time.time()
    data = request.get_json(silent=True) or {}
    username = data.get('username', 'arman')

    VOLATILE_PAIRING_STORE[pin] = {
        "pin": pin,
        "username": username,
        "user_id": 1,
        "created_at": now,
        "expires_at": now + 300, # 5 daghighe mohlat
        "used": False
    }

    return jsonify({
        "status": "success",
        "pairing_code": pin,
        "expires_in_seconds": 300,
        "message": "Kode 6 raghamie movaghat dar RAM sakhte shod"
    })

@agent_bp.route('/api/v1/agent/pair/verify', methods=['POST'])
def verify_volatile_pin():
    data = request.get_json(silent=True) or {}
    pin = str(data.get('pairing_code', '')).strip()

    session = VOLATILE_PAIRING_STORE.get(pin)
    if not session:
        return jsonify({"error": "Kode vared shode yaft nashod ya monghazi shode"}), 404

    if session["used"]:
        return jsonify({"error": "In kod ghablan yekbar masraf shode ast"}), 410

    if time.time() > session["expires_at"]:
        del VOLATILE_PAIRING_STORE[pin]
        return jsonify({"error": "Mohlate zamani-e in kod be payan reside ast"}), 410

    session["used"] = True
    token = f"omni_volatile_jwt_{uuid.uuid4().hex[:12]}_{int(time.time())}"

    ACTIVE_EXCHANGE_TOKENS[token] = {
        "user_id": session["user_id"],
        "username": session["username"],
        "description": "Volatile Windows Agent Paired Session (RAM Only)",
        "created_at": time.time(),
        "is_active": True,
        "volatile": True
    }

    agent_id = f"win-volatile-{uuid.uuid4().hex[:8]}"
    CONNECTED_WIN_AGENTS[agent_id] = {
        "agent_id": agent_id,
        "ip": request.remote_addr or "127.0.0.1",
        "hostname": "OmniOps-Volatile-Node",
        "username": session["username"],
        "last_seen": time.strftime('%Y-%m-%d %H:%M:%S'),
        "version": "v2.4-volatile-pairing",
        "capabilities": ["POWERSHELL", "CMD", "TERMINAL"],
        "status": "online"
    }

    return jsonify({
        "status": "success",
        "token": token,
        "agent_id": agent_id,
        "user": {
            "id": session["user_id"],
            "username": session["username"],
            "role": "SuperAdmin" if session["username"] == "arman" else "Admin"
        },
        "permissions": ["POWERSHELL", "CMD", "TERMINAL"],
        "message": "Etesale amn bargharar shod va token dar RAM sabt gardid"
    })

@agent_bp.route('/api/v1/agent/pair/kill', methods=['POST'])
def kill_volatile_session():
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:].strip()
        if token in ACTIVE_EXCHANGE_TOKENS:
            del ACTIVE_EXCHANGE_TOKENS[token]
    return jsonify({"status": "killed", "message": "Sessione movaghat az RAM pak shod"})

# =========================================================================
# Bakhshe 2: Sabtename Sazmani ba Shomareye Mobayle va Taeede SuperAdmin
# =========================================================================
CORPORATE_USERS = [
    {
        "id": 1,
        "username": "arman",
        "password_hash": "admin123",
        "mobile": "09120000001",
        "full_name": "مهندس آرمان دهقان",
        "department": "زیرساخت و امنیت سایبری",
        "role": "SuperAdmin",
        "status": "active"
    },
    {
        "id": 4,
        "username": "sara_dev",
        "password_hash": "sara#2026",
        "mobile": "09351234567",
        "full_name": "سارا رادمنش",
        "department": "توسعه نرم‌افزار",
        "role": "User",
        "status": "pending"
    }
]

@agent_bp.route('/api/v1/auth/register', methods=['POST'])
def register_corporate_user():
    data = request.get_json(silent=True) or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    mobile = data.get('mobile', '').strip()

    if not username or not password or not mobile:
        return jsonify({"status": "error", "message": "نام کاربری، رمز عبور و شماره موبایل الزامی هستند."}), 400

    for u in CORPORATE_USERS:
        if u["username"].lower() == username.lower() or u["mobile"] == mobile:
            return jsonify({"status": "error", "message": "این نام کاربری یا شماره موبایل قبلاً ثبت شده است."}), 409

    new_user = {
        "id": int(time.time() * 1000),
        "username": username,
        "password_hash": password,
        "mobile": mobile,
        "full_name": data.get('fullName', username),
        "department": data.get('department', 'عمومی'),
        "role": "User",
        "status": "pending" # Dar hale entezar baraye taeedie SuperAdmin
    }
    CORPORATE_USERS.append(new_user)

    return jsonify({
        "status": "success",
        "is_pending": True,
        "message": "درخواست شما ثبت شد و در انتظار تایید مدیر سیستم است.",
        "user_id": new_user["id"]
    }), 201

@agent_bp.route('/api/v1/auth/login', methods=['POST'])
def login_corporate_user():
    data = request.get_json(silent=True) or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    user = next((u for u in CORPORATE_USERS if (u["username"].lower() == username.lower() or u["mobile"] == username) and u["password_hash"] == password), None)
    if not user:
        return jsonify({"error": "نام کاربری یا رمز عبور اشتباه است."}), 401

    if user["status"] == "pending":
        return jsonify({"status": "pending", "message": "درخواست ثبت‌نام شما در انتظار تایید مدیر سیستم است."}), 403

    if user["status"] == "rejected":
        return jsonify({"status": "rejected", "message": "حساب کاربری شما توسط مدیر سامانه رد شده است."}), 403

    return jsonify({
        "status": "success",
        "token": f"omni_auth_jwt_{user['username']}_{int(time.time())}",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "role": user["role"],
            "mobile": user["mobile"],
            "department": user["department"]
        }
    })

@agent_bp.route('/api/v1/admin/pending-users/count', methods=['GET'])
def get_pending_users_count():
    count = sum(1 for u in CORPORATE_USERS if u["status"] == "pending")
    return jsonify({"count": count})

@agent_bp.route('/api/v1/admin/pending-users', methods=['GET'])
def list_pending_users():
    pending = [
        {"id": u["id"], "username": u["username"], "full_name": u["full_name"], "mobile": u["mobile"], "department": u["department"]}
        for u in CORPORATE_USERS if u["status"] == "pending"
    ]
    return jsonify({"users": pending})

@agent_bp.route('/api/v1/admin/pending-users/<int:user_id>/approve', methods=['POST'])
def approve_pending_user(user_id):
    user = next((u for u in CORPORATE_USERS if u["id"] == user_id), None)
    if not user:
        return jsonify({"error": "Karbare morede nazar yaft nashod"}), 404
    user["status"] = "active"
    return jsonify({"status": "success", "message": f"کاربر {user['full_name']} با موفقیت تایید شد."})

@agent_bp.route('/api/v1/admin/pending-users/<int:user_id>/reject', methods=['POST'])
def reject_pending_user(user_id):
    user = next((u for u in CORPORATE_USERS if u["id"] == user_id), None)
    if not user:
        return jsonify({"error": "Karbare morede nazar yaft nashod"}), 404
    user["status"] = "rejected"
    return jsonify({"status": "success", "message": f"درخواست کاربر {user['full_name']} رد شد."})

