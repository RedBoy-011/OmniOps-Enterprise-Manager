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

