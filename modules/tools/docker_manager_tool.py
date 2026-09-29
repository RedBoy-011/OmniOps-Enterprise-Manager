import subprocess
import json
from typing import Dict, Any
from modules.tools.base_tool import BaseTool

class DockerManagerTool(BaseTool):
    @property
    def id(self) -> str:
        return "docker_manager"

    @property
    def name(self) -> str:
        return "مدیریت کانتینرهای داکر (Docker Operations)"

    @property
    def description(self) -> str:
        return "لیست کردن وضعیت کانتینرها، بررسی مصرف منابع، استارت یا استاپ سرویس‌ها در سرور"

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["list", "inspect", "logs", "restart"],
                    "description": "عملیات مورد نظر روی داکر (list, inspect, logs, restart)"
                },
                "container_id": {
                    "type": "string",
                    "description": "شناسه یا نام کانتینر (در صورت نیاز)"
                }
            },
            "required": ["action"]
        }

    def execute(self, **kwargs) -> Dict[str, Any]:
        action = kwargs.get("action", "list")
        container_id = kwargs.get("container_id", "")

        try:
            if action == "list":
                cmd = ["docker", "ps", "-a", "--format", "{{json .}}"]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                if res.returncode != 0:
                    return {"success": False, "error": res.stderr or "سرویس داکر در دسترس نیست"}
                
                containers = []
                for line in res.stdout.strip().split('\n'):
                    if line:
                        try:
                            containers.append(json.loads(line))
                        except Exception:
                            pass
                return {"success": True, "containers": containers, "count": len(containers)}

            elif action == "logs" and container_id:
                cmd = ["docker", "logs", "--tail", "50", container_id]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                return {"success": res.returncode == 0, "logs": res.stdout or res.stderr}

            elif action == "restart" and container_id:
                cmd = ["docker", "restart", container_id]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
                return {"success": res.returncode == 0, "message": f"کانتینر {container_id} بازنشانی شد"}

            return {"success": False, "error": f"عملیات {action} پشتیبانی نمی‌شود یا پارامتر ناقص است"}

        except FileNotFoundError:
            return {"success": False, "error": "داکر روی این سرور نصب نیست یا در PATH موجود نمی‌باشد"}
        except Exception as e:
            return {"success": False, "error": str(e)}
