# Dynamic Tools Registry for OmniOps Enterprise
import os
import importlib
import inspect
from typing import Dict, List
from modules.tools.base_tool import BaseTool

class ToolRegistry:
    _instance = None
    _tools: Dict[str, BaseTool] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ToolRegistry, cls).__new__(cls)
            cls._instance._load_tools()
        return cls._instance

    def _load_tools(self):
        """اسکن و بارگذاری خودکار تمام ابزارهای موجود در دایرکتوری tools"""
        tools_dir = os.path.dirname(__file__)
        for file in os.listdir(tools_dir):
            if file.endswith('.py') and file not in ['__init__.py', 'base_tool.py', 'routes.py']:
                module_name = f"modules.tools.{file[:-3]}"
                try:
                    module = importlib.import_module(module_name)
                    for _, obj in inspect.getmembers(module):
                        if inspect.isclass(obj) and issubclass(obj, BaseTool) and obj != BaseTool:
                            tool_instance = obj()
                            self._tools[tool_instance.id] = tool_instance
                            print(f"[+] Loaded Tool/Skill: {tool_instance.name} ({tool_instance.id})")
                except Exception as e:
                    print(f"[-] Error loading tool {file}: {e}")

    def get_tool(self, tool_id: str) -> BaseTool:
        return self._tools.get(tool_id)

    def list_tools(self) -> List[Dict]:
        return [
            {
                'id': tool.id,
                'name': tool.name,
                'description': tool.description,
                'parameters': tool.parameters_schema
            }
            for tool in self._tools.values()
        ]

    def execute_tool(self, tool_id: str, args: dict) -> dict:
        tool = self.get_tool(tool_id)
        if not tool:
            return {'success': False, 'error': f'ابزار {tool_id} یافت نشد'}
        try:
            return tool.execute(**args)
        except Exception as e:
            return {'success': False, 'error': str(e)}

registry = ToolRegistry()
