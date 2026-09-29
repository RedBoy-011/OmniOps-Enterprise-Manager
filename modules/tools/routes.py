from flask import Blueprint, request, jsonify
from modules.tools import registry
from modules.auth.decorators import login_required, admin_required

tools_bp = Blueprint('tools', __name__)

@tools_bp.route('/list', methods=['GET'])
@login_required
def list_available_tools():
    """لیست تمامی ابزارهای سیستم برای نمایش در پنل و انتخاب در چت"""
    tools = registry.list_tools()
    return jsonify({
        'success': True,
        'count': len(tools),
        'tools': tools
    })

@tools_bp.route('/execute', methods=['POST'])
@admin_required
def execute_tool_endpoint():
    """اجرای مستقیم یک ابزار توسط ادمین از طریق پنل یا فراخوانی توسط چت"""
    data = request.get_json() or {}
    tool_id = data.get('tool_id')
    args = data.get('parameters', {})

    if not tool_id:
        return jsonify({'success': False, 'error': 'شناسه tool_id الزامی است'}), 400

    result = registry.execute_tool(tool_id, args)
    return jsonify({
        'tool_id': tool_id,
        'result': result
    })
