#!/usr/bin/env python3
"""
Backend Flask com Oracle Real
Caminho: backend/run.py
"""

import os
import sys
import logging
from flask import Flask
from flask_cors import CORS

# Adicionar o diretório app ao path do Python
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

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
    
    # Importar e inicializar Oracle
    try:
        from database import db
        
        # Inicializar pool de conexões Oracle
        db.initialize_pool()
        
        # Testar conexão
        if db.test_connection():
            logger.info("✅ Conectado ao Oracle: %s", db.config.dsn)
        else:
            logger.error("❌ Falha no teste de conexão Oracle")
            
    except Exception as e:
        logger.error("❌ Erro ao conectar Oracle: %s", e)
        logger.error("🔧 Verifique se o Oracle Client está instalado e configurado")
    
    # Registrar rotas de auth
    try:
        from routes.auth_routes import auth_bp
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        logger.info("✅ Rotas de autenticação registradas")
        
    except Exception as e:
        logger.error("❌ Erro ao registrar rotas auth: %s", e)
    
    # Rota de teste
    @app.route('/api/test')
    def test():
        return {
            'status': 'ok',
            'message': 'Backend Flask com Oracle funcionando!',
            'version': '1.0.0',
            'database': db.config.dsn if 'db' in locals() else 'não conectado'
        }
    
    # Health check
    @app.route('/api/health')
    def health():
        try:
            db_status = db.test_connection() if 'db' in locals() else False
            return {
                'status': 'healthy' if db_status else 'unhealthy',
                'database': 'connected' if db_status else 'disconnected',
                'dsn': db.config.dsn if 'db' in locals() else 'N/A',
                'message': 'API funcionando com Oracle real'
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Erro na conexão Oracle'
            }, 500
    
    return app

if __name__ == '__main__':
    try:
        app = create_app()
        
        print("\n" + "="*60)
        print("🚀 INICIANDO BACKEND FLASK COM ORACLE")
        print("="*60)
        print(f"📍 URL: http://localhost:5000")
        print(f"🔧 Debug: {app.config.get('DEBUG', False)}")
        print(f"🗄️  Oracle: 192.168.0.9:1521/SMLMV")
        print(f"👤 Usuário: dbamv")
        print("="*60 + "\n")
        
        app.run(
            debug=True,
            host='0.0.0.0',
            port=5000,
            use_reloader=True
        )
        
    except Exception as e:
        logger.error("❌ Erro fatal ao iniciar aplicação: %s", e)
        exit(1)