# Chat Blueprint for OmniOps Enterprise Manager
from flask import Blueprint, jsonify, request
import uuid
import time
from config.database import get_db_connection

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/sessions', methods=['GET'])
def get_sessions():
    conn = get_db_connection()
    sessions = conn.execute('SELECT * FROM chat_sessions ORDER BY updated_at DESC').fetchall()
    conn.close()
    return jsonify({
        'sessions': [dict(s) for s in sessions]
    })

@chat_bp.route('/sessions', methods=['POST'])
def create_session():
    data = request.get_json() or {}
    session_id = str(uuid.uuid4())
    user_id = data.get('user_id', 1)
    title = data.get('title', 'New Operational Task')
    selected_model = data.get('model', 'gemini-2.5-flash')
    
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO chat_sessions (id, user_id, title, selected_model)
        VALUES (?, ?, ?, ?)
    ''', (session_id, user_id, title, selected_model))
    conn.commit()
    conn.close()
    
    return jsonify({
        'id': session_id,
        'title': title,
        'selected_model': selected_model,
        'created_at': int(time.time())
    }), 201
