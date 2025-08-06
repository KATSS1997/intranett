"""
Aplicação Flask Principal - VERSÃO ATUALIZADA
Caminho: backend/app/__init__.py
"""

import os
import sys
import logging
from flask import Flask, request, jsonify
from datetime import datetime
import traceback

# Configurar logging antes de tudo
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('logs/app.log', mode='a', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

def create_app():
    """Cria e configura a aplicação Flask"""
    
    # Criar app Flask
    app = Flask(__name__)
    
    # ===========================================
    # CONFIGURAÇÕES
    # ===========================================
    
    # Configurações básicas
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['DEBUG'] = os.getenv('FLASK_ENV') == 'development'
    app.config['TESTING'] = False
    
    # Configurações de segurança
    app.config['JSON_SORT_KEYS'] = False
    app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False if not app.config['DEBUG'] else True
    
    logger.info(f"🚀 Inicializando Flask App - Modo: {os.getenv('FLASK_ENV', 'development')}")
    
    # ===========================================
    # CORS
    # ===========================================
    try:
        from config.cors import configure_cors
        configure_cors(app)
        logger.info("✅ CORS configurado")
    except ImportError as e:
        logger.warning(f"⚠️  Configuração CORS não encontrada: {e}")
        # CORS básico como fallback
        from flask_cors import CORS
        CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])
        logger.info("✅ CORS básico configurado")
    
    # ===========================================
    # DATABASE
    # ===========================================
    try:
        from database import db
        
        # Inicializar pool de conexões Oracle
        db.initialize_pool()
        logger.info("✅ Pool de conexões Oracle inicializado")
        
        # Testar conexão
        if db.test_connection():
            logger.info(f"✅ Conectado ao Oracle: {db.config.dsn}")
        else:
            logger.error("❌ Falha no teste de conexão Oracle")
            
    except Exception as e:
        logger.error(f"❌ Erro ao conectar Oracle: {e}")
        logger.error("🔧 Verifique se o Oracle Client está instalado e configurado")
    
    # ===========================================
    # REGISTRAR BLUEPRINTS
    # ===========================================
    
    # 1. Rotas de autenticação
    try:
        from routes.auth_routes import auth_bp
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        logger.info("✅ Rotas de autenticação registradas (/api/auth)")
        
    except Exception as e:
        logger.error(f"❌ Erro ao registrar rotas auth: {e}")
        logger.error(f"❌ Stack trace: {traceback.format_exc()}")
    
    # 2. Rotas de usuário (se existir)
    try:
        from routes.user_routes import user_bp
        app.register_blueprint(user_bp, url_prefix='/api/users')
        logger.info("✅ Rotas de usuário registradas (/api/users)")
        
    except ImportError:
        logger.info("⚠️  Rotas de usuário não encontradas (opcional)")
    except Exception as e:
        logger.error(f"❌ Erro ao registrar rotas user: {e}")
    
    # 3. Outras rotas podem ser adicionadas aqui...
    
    # ===========================================
    # ROTAS BÁSICAS
    # ===========================================
    
    @app.route('/')
    def index():
        """Rota raiz para verificar se a API está funcionando"""
        return jsonify({
            'status': 'ok',
            'message': 'Intranet Backend API funcionando!',
            'version': '1.0.0',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        })
    
    @app.route('/api/test')
    def test():
        """Rota de teste para verificar conectividade"""
        try:
            # Testar conexão com Oracle
            from database import db
            connection_ok = db.test_connection()
            
            return jsonify({
                'status': 'ok',
                'message': 'Backend Flask com Oracle funcionando!',
                'database_status': 'connected' if connection_ok else 'disconnected',
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'environment': os.getenv('FLASK_ENV', 'development')
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': 'Erro ao testar conexões',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }), 500
    
    @app.route('/api/health')
    def health():
        """Health check para monitoramento"""
        try:
            from database import db
            db_status = 'ok' if db.test_connection() else 'error'
        except Exception:
            db_status = 'error'
        
        status_code = 200 if db_status == 'ok' else 503
        
        return jsonify({
            'status': 'ok' if db_status == 'ok' else 'degraded',
            'services': {
                'database': db_status,
                'api': 'ok'
            },
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), status_code
    
    # ===========================================
    # ERROR HANDLERS GLOBAIS
    # ===========================================
    
    @app.errorhandler(400)
    def bad_request(error):
        logger.warning(f"Bad Request (400): {request.url} - {error.description}")
        return jsonify({
            'success': False,
            'message': 'Requisição inválida',
            'error_code': 'BAD_REQUEST',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        logger.warning(f"Unauthorized (401): {request.url} - {request.remote_addr}")
        return jsonify({
            'success': False,
            'message': 'Acesso não autorizado',
            'error_code': 'UNAUTHORIZED',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        logger.warning(f"Forbidden (403): {request.url} - {request.remote_addr}")
        return jsonify({
            'success': False,
            'message': 'Acesso negado',
            'error_code': 'FORBIDDEN',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 403
    
    @app.errorhandler(404)
    def not_found(error):
        logger.warning(f"Not Found (404): {request.url}")
        return jsonify({
            'success': False,
            'message': 'Endpoint não encontrado',
            'error_code': 'NOT_FOUND',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        logger.warning(f"Method Not Allowed (405): {request.method} {request.url}")
        return jsonify({
            'success': False,
            'message': f'Método {request.method} não permitido para este endpoint',
            'error_code': 'METHOD_NOT_ALLOWED',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 405
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal Server Error (500): {request.url}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': 'Erro interno do servidor',
            'error_code': 'INTERNAL_SERVER_ERROR',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 500
    
    # ===========================================
    # MIDDLEWARE DE REQUEST/RESPONSE
    # ===========================================
    
    @app.before_request
    def log_request_info():
        """Log informações básicas de cada request"""
        if request.endpoint != 'static':  # Não logar arquivos estáticos
            logger.debug(f"📥 {request.method} {request.url} - {request.remote_addr}")
    
    @app.after_request
    def log_response_info(response):
        """Log informações básicas de cada response"""
        if request.endpoint != 'static':
            status_emoji = "✅" if response.status_code < 400 else "❌"
            logger.debug(f"📤 {status_emoji} {response.status_code} {request.method} {request.url}")
        
        return response
    
    # ===========================================
    # INICIALIZAR SERVIÇOS
    # ===========================================
    
    # Inicializar serviço de auth se disponível
    try:
        from auth.auth_service import auth_service
        # Qualquer inicialização necessária do auth_service
        logger.info("✅ Serviço de autenticação carregado")
    except ImportError:
        logger.warning("⚠️  Serviço de autenticação não encontrado")
    except Exception as e:
        logger.error(f"❌ Erro ao carregar serviço de auth: {e}")
    
    logger.info("🎉 Flask App criada com sucesso!")
    
    return app

# ===========================================
# FACTORY FUNCTION ADICIONAL
# ===========================================

def create_test_app():
    """Cria app para testes unitários"""
    app = create_app()
    app.config['TESTING'] = True
    app.config['DEBUG'] = False
    return app