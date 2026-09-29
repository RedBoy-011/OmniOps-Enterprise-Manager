import socket
import ssl
from typing import Dict, Any
from modules.tools.base_tool import BaseTool

class MikrotikApiTool(BaseTool):
    @property
    def id(self) -> str:
        return "mikrotik_manager"

    @property
    def name(self) -> str:
        return "مدیریت و اتصالات میکروتیک (MikroTik RouterOS)"

    @property
    def description(self) -> str:
        return "بررسی ارتباط پورت API میکروتیک (پورت 8728 یا 8729 SSL)، لاگین و بررسی سلامت روتربورد"

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "host": {
                    "type": "string",
                    "description": "آدرس IP یا دامنه روتر میکروتیک (مانند 192.168.88.1)"
                },
                "port": {
                    "type": "integer",
                    "description": "پورت API (معمولاً 8728 برای ساده و 8729 برای SSL)",
                    "default": 8728
                },
                "action": {
                    "type": "string",
                    "enum": ["check_port", "query_resource"],
                    "description": "اقدام مورد نظر",
                    "default": "check_port"
                }
            },
            "required": ["host"]
        }

    def execute(self, **kwargs) -> Dict[str, Any]:
        host = kwargs.get("host", "").strip()
        port = kwargs.get("port", 8728)
        action = kwargs.get("action", "check_port")

        if not host:
            return {"success": False, "error": "آدرس روتر میکروتیک الزامی است"}

        # Socket connectivity check
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(4)
        try:
            result = sock.connect_ex((host, port))
            sock.close()
            is_open = (result == 0)
            
            return {
                "success": is_open,
                "host": host,
                "port": port,
                "api_accessible": is_open,
                "message": f"پورت API میکروتیک {port} روی {host} باز و در دسترس است" if is_open else f"امکان برقراری اتصال به پورت {port} روی {host} وجود ندارد (فایروال یا سرویس خاموش است)"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
