# Proxy connection tester and manager
import socket
import urllib.request
from config.settings import Config
from modules.settings.models import SystemSettingModel

class ProxyManager:
    @staticmethod
    def get_proxy_settings():
        enabled = SystemSettingModel.get('socks5_enabled', 'false') == 'true'
        host = SystemSettingModel.get('socks5_host', '127.0.0.1')
        port = int(SystemSettingModel.get('socks5_port', '1080'))
        return {
            'enabled': enabled,
            'host': host,
            'port': port,
            'url': f"socks5://{host}:{port}" if enabled else None
        }

    @staticmethod
    def test_proxy(host: str, port: int) -> dict:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3.5)
        try:
            result = sock.connect_ex((host, int(port)))
            sock.close()
            if result == 0:
                return {'success': True, 'message': f'ارتباط موفق با پراکسی SOCKS5 در {host}:{port}'}
            else:
                return {'success': False, 'message': f'پراکسی در آدرس {host}:{port} پاسخگو نیست'}
        except Exception as e:
            return {'success': False, 'message': str(e)}

    @staticmethod
    def get_requests_proxies():
        cfg = ProxyManager.get_proxy_settings()
        if cfg['enabled']:
            return {
                'http': f"socks5h://{cfg['host']}:{cfg['port']}",
                'https': f"socks5h://{cfg['host']}:{cfg['port']}"
            }
        return None
