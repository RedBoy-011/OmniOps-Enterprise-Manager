import subprocess
import platform
import re
from typing import Dict, Any
from modules.tools.base_tool import BaseTool

class NetworkPingTool(BaseTool):
    @property
    def id(self) -> str:
        return "network_ping"

    @property
    def name(self) -> str:
        return "تست پینگ و تاخیر شبکه (ICMP Ping)"

    @property
    def description(self) -> str:
        return "ارسال پکت‌های ICMP به آدرس IP یا دامنه برای بررسی وضعیت اتصال و تاخیر شبکه"

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "host": {
                    "type": "string",
                    "description": "آدرس مقصد یا دامنه (مانند 8.8.8.8 یا google.com یا 192.168.1.1)"
                },
                "count": {
                    "type": "integer",
                    "description": "تعداد پکت‌ها (پیش‌فرض ۴)",
                    "default": 4
                }
            },
            "required": ["host"]
        }

    def execute(self, **kwargs) -> Dict[str, Any]:
        host = kwargs.get("host", "").strip()
        count = kwargs.get("count", 4)
        if not host:
            return {"success": False, "error": "آدرس میزبان وارد نشده است"}

        param = "-n" if platform.system().lower() == "windows" else "-c"
        command = ["ping", param, str(count), host]

        try:
            res = subprocess.run(command, capture_output=True, text=True, timeout=10)
            output = res.stdout
            
            # Simple latency parse
            latency_matches = re.findall(r"(?:time|زمان)[=<](\d+\.?\d*)\s*ms", output, re.IGNORECASE)
            avg_latency = sum(float(x) for x in latency_matches) / len(latency_matches) if latency_matches else None

            return {
                "success": res.returncode == 0,
                "host": host,
                "reachable": res.returncode == 0,
                "average_latency_ms": round(avg_latency, 2) if avg_latency else None,
                "output": output
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
