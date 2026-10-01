# Model Context Protocol (MCP) Hub & JSON-RPC Gateway
# Hameye comment-haye in code be darkhaste karbar be zabane Finglish neveshte shodeand.

from flask import Blueprint, request, jsonify
import time

mcp_bp = Blueprint('mcp', __name__)

# Registry-e sarvarhaye MCP motasel
MCP_SERVERS = [
    {
        "id": "mcp-fs",
        "name": "Local Filesystem MCP",
        "transport": "stdio",
        "endpoint": "local://stdio",
        "status": "connected",
        "latency_ms": 1,
        "tools_count": 4,
        "tools": [
            {"name": "read_file", "description": "Khandane mohtavaye yek file ba masire etebarsanji shode", "category": "fs"},
            {"name": "write_file", "description": "Neveshtane mohtava dar file ba bazbini diff", "category": "fs"},
            {"name": "list_directory", "description": "List kardane file-ha va pooshehaye mojood", "category": "fs"},
            {"name": "search_code", "description": "Jostojooye matn ya regex dar kolle codebase", "category": "code"}
        ]
    },
    {
        "id": "mcp-github",
        "name": "GitHub Enterprise Connector",
        "transport": "sse",
        "endpoint": "https://api.github.com/mcp",
        "status": "connected",
        "latency_ms": 42,
        "tools_count": 3,
        "tools": [
            {"name": "create_pull_request", "description": "Sakhte PR jadid ba commit-haye tahiyeh shode", "category": "git"},
            {"name": "get_commit_diff", "description": "Daryafte diff taghirat dar branch", "category": "git"},
            {"name": "list_issues", "description": "Barresie issue-haye marboot be bug-haye amaliati", "category": "git"}
        ]
    },
    {
        "id": "mcp-postgres",
        "name": "PostgreSQL Database Engine",
        "transport": "stdio",
        "endpoint": "postgres://cluster-db:5432/omniops",
        "status": "connected",
        "latency_ms": 3,
        "tools_count": 2,
        "tools": [
            {"name": "execute_read_query", "description": "Ejraye safe query SELECT dar database", "category": "database"},
            {"name": "describe_schema", "description": "Daryafte sakhtare jadavel va foreign key-ha", "category": "database"}
        ]
    },
    {
        "id": "mcp-docker",
        "name": "Docker Container Runtime MCP",
        "transport": "stdio",
        "endpoint": "unix:///var/run/docker.sock",
        "status": "connected",
        "latency_ms": 2,
        "tools_count": 3,
        "tools": [
            {"name": "list_containers", "description": "List kardane container-haye active va worker", "category": "terminal"},
            {"name": "inspect_container_logs", "description": "Daryafte log-haye zendeye container", "category": "terminal"},
            {"name": "restart_worker_node", "description": "Restart kardane worker container dar soorate khata", "category": "terminal"}
        ]
    }
]

@mcp_bp.route('/servers', methods=['GET'])
def list_servers():
    return jsonify({
        'status': 'success',
        'servers': MCP_SERVERS,
        'total_servers': len(MCP_SERVERS),
        'total_tools': sum(s['tools_count'] for s in MCP_SERVERS)
    })

@mcp_bp.route('/rpc', methods=['POST'])
def handle_json_rpc():
    """
    Standard Model Context Protocol JSON-RPC 2.0 Handler
    """
    payload = request.get_json() or {}
    rpc_id = payload.get('id', 1)
    method = payload.get('method', '')
    params = payload.get('params', {})

    # Method-haye standard MCP
    if method == "tools/list":
        all_tools = []
        for s in MCP_SERVERS:
            for t in s.get('tools', []):
                all_tools.append({**t, "server_id": s['id']})
        return jsonify({
            "jsonrpc": "2.0",
            "id": rpc_id,
            "result": {"tools": all_tools}
        })

    elif method == "tools/call":
        tool_name = params.get('name')
        arguments = params.get('arguments', {})
        # Simulating execution of MCP tool
        return jsonify({
            "jsonrpc": "2.0",
            "id": rpc_id,
            "result": {
                "content": [
                    {
                        "type": "text",
                        "text": f"MCP Tool '{tool_name}' executed safely. Params: {arguments}"
                    }
                ],
                "isError": False
            }
        })

    elif method == "ping":
        return jsonify({
            "jsonrpc": "2.0",
            "id": rpc_id,
            "result": {"status": "pong", "timestamp": time.time()}
        })

    else:
        return jsonify({
            "jsonrpc": "2.0",
            "id": rpc_id,
            "error": {"code": -32601, "message": f"Method '{method}' peyda nashod"}
        }), 404
