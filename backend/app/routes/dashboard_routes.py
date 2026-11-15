# backend/app/routes/dashboard_routes.py
# --- ARQUIVO CORRIGIDO ---

from flask import Blueprint, jsonify
# Corrigido: A importação agora é relativa ao pacote 'app'
from app.database import get_db
from ..auth.decorators import token_required

dashboard_bp = Blueprint('dashboard_bp', __name__)

@dashboard_bp.route('/', methods=['GET'])
@token_required
def get_dashboard_data():
    """
    Endpoint de exemplo para dados do dashboard.
    Protegido por token.
    """
    # Exemplo de como você poderia usar a conexão com o banco aqui,
    # embora o ideal seja usar uma camada de serviço como em 'user_service.py'.
    try:
        # db = get_db()
        # cursor = db.cursor()
        # cursor.execute("SELECT COUNT(*) FROM users")
        # user_count = cursor.fetchone()[0]
        # cursor.close()
        
        mock_data = {
            "total_users": 150, # Substituir por user_count quando a tabela existir
            "active_sessions": 12,
            "latest_news": "A intranet está no ar!"
            
        }
        return jsonify(mock_data), 200
    except Exception as e:
        print(f"Erro ao buscar dados do dashboard: {e}")
        return jsonify({"error": "Não foi possível carregar os dados do dashboard."}), 500

