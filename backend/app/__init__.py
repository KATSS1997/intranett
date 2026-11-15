# backend/app/__init__.py
# --- ARQUIVO CORRIGIDO E REATORADO ---

import os
from flask import Flask
from flask_cors import CORS
from app.database import init_db
from app.config import Config

def create_app(config_class=Config):
    """
    Função de fábrica (Application Factory) para criar e configurar a aplicação Flask.
    Esta é a abordagem recomendada para evitar problemas de importação circular.
    """
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Habilita o CORS para permitir que o frontend (em outro domínio) acesse a API
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Inicializa a conexão com o banco de dados dentro do contexto da aplicação
    with app.app_context():
        init_db(app)

    # --- REGISTRO DOS BLUEPRINTS (MÓDULOS DE ROTAS) ---
    # Importa e registra cada conjunto de rotas na aplicação principal.
    
    from app.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    from app.routes.user_routes import user_bp
    app.register_blueprint(user_bp, url_prefix='/api/users')

    from app.routes.dashboard_routes import dashboard_bp
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

    # Rota simples para verificar a saúde do servidor
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {"status": "ok", "message": "Backend is running!"}

    return app

