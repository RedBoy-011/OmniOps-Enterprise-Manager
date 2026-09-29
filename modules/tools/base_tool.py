# Base Tool Interface
from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseTool(ABC):
    """
    کلاس پایه برای تمام ابزارها و مهارت‌های پلتفرم OmniOps.
    هر فایل جدید در پوشه /tools که از این کلاس ارث‌بری کند، به صورت خودکار شناسایی و لود می‌شود.
    """
    
    @property
    @abstractmethod
    def id(self) -> str:
        """شناسه یکتای ابزار (مثال: powershell_exec, ping_check, docker_ops)"""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """نام نمایشی فارسی/انگلیسی ابزار"""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """توضیحات عملکرد ابزار برای مدل‌های هوش مصنوعی (Tool Description)"""
        pass

    @property
    @abstractmethod
    def parameters_schema(self) -> Dict[str, Any]:
        """طرح پارامترهای ابزار مطابق استاندارد JSON Schema برای Function Calling"""
        pass

    @abstractmethod
    def execute(self, **kwargs) -> Dict[str, Any]:
        """متد اجرای عملیات و برگرداندن خروجی استاندارد"""
        pass
