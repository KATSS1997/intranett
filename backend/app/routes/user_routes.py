# backend/app/routes/user_routes.py
# --- ARQUIVO CORRIGIDO ---

from flask import Blueprint, jsonify
from app.services.user_service import UserService
# Corrigido: O nome do decorator importado agora é 'token_required'
from ..auth.decorators import token_required, roles_required

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/', methods=['GET'])
@token_required
def get_users():
    """
    Endpoint para buscar todos os usuários.
    Protegido por token.
    """
    try:
        users = UserService.get_all_users()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route('/<int:user_id>', methods=['GET'])
@token_required
def get_user(user_id):
    """
    Endpoint para buscar um usuário específico pelo ID.
    Protegido por token.
    """
    try:
        user = UserService.get_user_by_id(user_id)
        if user:
            return jsonify(user), 200
        return jsonify({"message": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Exemplo de rota protegida por role
@user_bp.route('/admin', methods=['GET'])
@token_required
@roles_required('admin')
def admin_only_route():
    """
    Endpoint de exemplo que só pode ser acessado por usuários com a role 'admin'.
    """
    return jsonify({"message": "Welcome, Admin!"}), 200


# backend/app/routes/dashboard_routes.py
# --- ARQUIVO CORRIGIDO ---

from flask import Blueprint, jsonify
# Corrigido: O nome do decorator importado agora é 'token_required'
from ..auth.decorators import token_required

dashboard_bp = Blueprint('dashboard_bp', __name__)

@dashboard_bp.route('/', methods=['GET'])
@token_required
def get_dashboard_data():
    """
    Endpoint de exemplo para dados do dashboard.
    Protegido por token.
    """
    # Aqui você colocaria a lógica para buscar os dados do dashboard
    mock_data = {
        "total_users": 150,
        "active_sessions": 12,
        "latest_news": "A intranet está no ar!"
    }
    return jsonify(mock_data), 200

