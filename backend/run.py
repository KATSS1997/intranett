#!/usr/bin/env python3
"""
Arquivo de execução do backend Flask
Caminho: backend/run.py
"""

import os
import logging
from flask import Flask
from flask_cors import CORS

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Cria e configura a aplicação Flask"""
    app = Flask(__name__)
    
    # Configurações
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['DEBUG'] = os.getenv('FLASK_ENV') == 'development'
    
    # CORS
    CORS(app, origins=["http://localhost:3000"])
    
    # Importar e registrar blueprints
    try:
        # Teste de conexão com Oracle
        from app.database import db
        from app.config import DatabaseConfig
        
        # Inicializar pool de conexões
        db.initialize_pool()
        
        # Testar conexão
        if db.test_connection():
            logger.info("✅ Conectado ao Oracle em %s", db.config.dsn)
        else:
            logger.error("❌ Falha na conexão Oracle")
            
    except Exception as e:
        logger.error("❌ Erro ao conectar Oracle: %s", e)
    
    # Registrar rotas de auth
    try:
        from app.routes.auth_routes import auth_bp
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        logger.info("✅ Rotas de autenticação registradas")
        
    except Exception as e:
        logger.error("❌ Erro ao registrar rotas auth: %s", e)
    
    # Registrar rotas de usuário (exemplo)
    try:
        from app.routes.user_routes import user_bp
        app.register_blueprint(user_bp, url_prefix='/api/users')
        logger.info("✅ Rotas de usuário registradas")
        
    except Exception as e:
        logger.warning("⚠️ Rotas de usuário não encontradas: %s", e)
    
    # Rota de teste simples
    @app.route('/api/test')
    def test():
        return {
            'status': 'ok',
            'message': 'Backend Flask funcionando!',
            'version': '1.0.0'
        }
    
    # Health check
    @app.route('/api/health')
    def health():
        try:
            db_status = db.test_connection() if 'db' in locals() else False
            return {
                'status': 'healthy',
                'database': 'connected' if db_status else 'disconnected',
                'message': 'API funcionando'
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e)
            }, 500
    
    return app

if __name__ == '__main__':
    try:
        app = create_app()
        
        print("\n" + "="*50)
        print("🚀 INICIANDO BACKEND FLASK")
        print("="*50)
        print(f"📍 URL: http://localhost:5000")
        print(f"🔧 Debug: {app.config.get('DEBUG', False)}")
        print(f"🔑 Secret Key: {'✅ Configurado' if app.config.get('SECRET_KEY') else '❌ Não configurado'}")
        print("="*50 + "\n")
        
        app.run(
            debug=True,
            host='0.0.0.0',
            port=5000,
            use_reloader=True
        )
        
    except Exception as e:
        logger.error("❌ Erro fatal ao iniciar aplicação: %s", e)
        exit(1)