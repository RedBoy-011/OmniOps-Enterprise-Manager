import subprocess
import platform
from typing import Dict, Any
from modules.tools.base_tool import BaseTool

class PowerShellTool(BaseTool):
    @property
    def id(self) -> str:
        return "powershell_exec"

    @property
    def name(self) -> str:
        return "اجرای فرامین PowerShell / Shell سیستم"

    @property
    def description(self) -> str:
        return "اجرای امن دستورات PowerShell روی ویندوز یا Bash در لینوکس برای عیب‌یابی و مدیریت سیستم"

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "دستور مورد نظر جهت اجرا (مانند Get-Process, ipconfig, ls, uname)"
                },
                "timeout": {
                    "type": "integer",
                    "description": "حداکثر زمان اجرا بر حسب ثانیه (پیش‌فرض ۱۵)",
                    "default": 15
                }
            },
            "required": ["command"]
        }

    def execute(self, **kwargs) -> Dict[str, Any]:
        command = kwargs.get("command", "")
        timeout = kwargs.get("timeout", 15)

        is_windows = platform.system() == "Windows"
        shell_cmd = ["powershell", "-NoProfile", "-NonInteractive", "-Command", command] if is_windows else ["bash", "-c", command]

        try:
            res = subprocess.run(
                shell_cmd,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return {
                "success": res.returncode == 0,
                "exit_code": res.returncode,
                "stdout": res.stdout,
                "stderr": res.stderr,
                "platform": platform.system()
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": f"اجرای دستور پس از {timeout} ثانیه تایم‌اوت شد"}
        except Exception as e:
            return {"success": False, "error": str(e)}
