import subprocess
import platform
from typing import Dict, Any
from modules.tools.base_tool import BaseTool

class WindowsServiceTool(BaseTool):
    @property
    def id(self) -> str:
        return "windows_services"

    @property
    def name(self) -> str:
        return "بررسی و کنترل سرویس‌های ویندوز / Systemd"

    @property
    def description(self) -> str:
        return "بررسی وضعیت سرویس‌های سیستمی ویندوز (Get-Service) یا سرویس‌های Systemd لینوکس"

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "service_name": {
                    "type": "string",
                    "description": "نام سرویس (مثال: Spooler, wuauserv, nginx, docker, omniops)"
                },
                "action": {
                    "type": "string",
                    "enum": ["status", "start", "stop", "restart"],
                    "description": "عملیات مورد نظر (status, start, stop, restart)",
                    "default": "status"
                }
            },
            "required": ["service_name"]
        }

    def execute(self, **kwargs) -> Dict[str, Any]:
        service_name = kwargs.get("service_name", "").strip()
        action = kwargs.get("action", "status")

        if not service_name:
            return {"success": False, "error": "نام سرویس وارد نشده است"}

        is_windows = platform.system() == "Windows"
        
        try:
            if is_windows:
                if action == "status":
                    ps_cmd = f"Get-Service -Name '{service_name}' | Select-Object Name, DisplayName, Status | ConvertTo-Json"
                elif action == "restart":
                    ps_cmd = f"Restart-Service -Name '{service_name}'; Get-Service -Name '{service_name}' | Select-Object Name, Status | ConvertTo-Json"
                elif action == "start":
                    ps_cmd = f"Start-Service -Name '{service_name}'; Get-Service -Name '{service_name}' | Select-Object Name, Status | ConvertTo-Json"
                else:
                    ps_cmd = f"Stop-Service -Name '{service_name}'; Get-Service -Name '{service_name}' | Select-Object Name, Status | ConvertTo-Json"
                
                res = subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True, text=True, timeout=10)
                return {
                    "success": res.returncode == 0,
                    "service": service_name,
                    "output": res.stdout,
                    "platform": "Windows"
                }
            else:
                # Linux systemctl fallback
                cmd = ["systemctl", "is-active", service_name] if action == "status" else ["sudo", "systemctl", action, service_name]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                return {
                    "success": res.returncode == 0,
                    "service": service_name,
                    "status": res.stdout.strip() or ("active" if res.returncode == 0 else "inactive"),
                    "platform": "Linux (systemd)"
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
