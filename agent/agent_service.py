# OmniOps Enterprise Client - Background Agent Service for Windows / Network Admins
import time
import requests
import subprocess
import platform
import json
import os

SERVER_URL = os.environ.get("OMNIOPS_SERVER_URL", "http://localhost:8080")
AGENT_TOKEN = os.environ.get("OMNIOPS_AGENT_TOKEN", "agent-token-secure-2026")
DEVICE_NAME = platform.node()

print(f"[*] Starting OmniOps Local Agent on {DEVICE_NAME}...")
print(f"[*] Connecting to Master Server: {SERVER_URL}")

def report_status():
    payload = {
        "device_name": DEVICE_NAME,
        "os": platform.system(),
        "release": platform.release(),
        "arch": platform.machine(),
        "agent_version": "1.0.0"
    }
    try:
        requests.post(f"{SERVER_URL}/api/tools/agent/heartbeat", json=payload, headers={"X-Agent-Token": AGENT_TOKEN}, timeout=5)
    except Exception as e:
        pass

def poll_tasks():
    try:
        res = requests.get(f"{SERVER_URL}/api/tools/agent/pending-tasks", headers={"X-Agent-Token": AGENT_TOKEN}, timeout=5)
        if res.status_code == 200:
            tasks = res.json().get("tasks", [])
            for task in tasks:
                execute_task(task)
    except Exception:
        pass

def execute_task(task):
    task_id = task.get("id")
    cmd = task.get("command")
    print(f"[>] Executing Task {task_id}: {cmd}")
    try:
        is_win = platform.system() == "Windows"
        shell_cmd = ["powershell", "-Command", cmd] if is_win else ["bash", "-c", cmd]
        res = subprocess.run(shell_cmd, capture_output=True, text=True, timeout=30)
        requests.post(f"{SERVER_URL}/api/tools/agent/task-result", json={
            "task_id": task_id,
            "stdout": res.stdout,
            "stderr": res.stderr,
            "exit_code": res.returncode
        }, headers={"X-Agent-Token": AGENT_TOKEN})
    except Exception as e:
        requests.post(f"{SERVER_URL}/api/tools/agent/task-result", json={
            "task_id": task_id,
            "error": str(e),
            "exit_code": -1
        }, headers={"X-Agent-Token": AGENT_TOKEN})

if __name__ == "__main__":
    while True:
        report_status()
        poll_tasks()
        time.sleep(5)
