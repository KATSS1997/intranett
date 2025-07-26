"""
Rotas de Autenticação
Caminho: backend/app/routes/auth_routes.py
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import logging
from typing import Dict, Any

# Imports corrigidos (sem relativos)
try:
    from auth.auth_service import auth_service
    from utils.responses import success_response, error_response
    from utils.validators import validate_login_data
except ImportError:
    # Fallback se não encontrar os módulos
    def success_response(data=None, message="Success"):
        return jsonify({"success": True, "message": message, "data": data})
    
    def error_response(message="Error", code=400, error_code=None):
        return jsonify({"success": False, "message": message, "error_code": error_code}), code
    
    def validate_login_data(cd_usuario, password, cd_multi_empresa):
        if not cd_usuario: return "Usuário obrigatório"
        if not password: return "Senha obrigatória" 
        if not cd_multi_empresa: return "Empresa obrigatória"
        return None
    
    # Mock simples se auth_service não estiver disponível
    class MockAuthService:
        def authenticate(self, cd_usuario, password, cd_multi_empresa):
            return {
                'success': False,
                'error': 'Serviço de autenticação não disponível',
                'code': 'SERVICE_UNAVAILABLE'
            }
        def verify_token(self, token): return None
        def log_access(self, *args): pass
    
    auth_service = MockAuthService()

logger = logging.getLogger(__name__)

# Blueprint para rotas de autenticação
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Endpoint de login
    POST /api/auth/login
    
    Payload esperado:
    {
        "cdUsuario": "user123",
        "password": "senha123",
        "cdMultiEmpresa": 1
    }
    """
    try:
        # Captura dados da requisição
        data = request.get_json()
        
        if not data:
            return error_response(
                message="Dados de login são obrigatórios",
                code=400,
                error_code="MISSING_DATA"
            )
        
        # Extrai campos com nomes compatíveis com frontend
        cd_usuario = data.get('cdUsuario')
        password = data.get('password')
        cd_multi_empresa = data.get('cdMultiEmpresa')
        
        # Log da tentativa (sem senha)
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        user_agent = request.headers.get('User-Agent', 'Unknown')
        
        logger.info(f"Tentativa de login: {cd_usuario}@{cd_multi_empresa} de {client_ip}")
        
        # Validação básica dos dados
        validation_error = validate_login_data(cd_usuario, password, cd_multi_empresa)
        if validation_error:
            return error_response(
                message=validation_error,
                code=400,
                error_code="VALIDATION_ERROR"
            )
        
        # Chama serviço de autenticação
        auth_result = auth_service.authenticate(cd_usuario, password, cd_multi_empresa)
        
        if not auth_result['success']:
            # Log da falha
            logger.warning(f"Login falhou: {cd_usuario}@{cd_multi_empresa} - {auth_result.get('error')}")
            
            return error_response(
                message=auth_result['error'],
                code=401,
                error_code=auth_result.get('code', 'AUTH_FAILED')
            )
        
        # Sucesso - registra log de acesso
        auth_service.log_access(cd_usuario, cd_multi_empresa, client_ip, user_agent)
        
        # Log do sucesso (sem dados sensíveis)
        logger.info(f"Login bem-sucedido: {cd_usuario}@{cd_multi_empresa}")
        
        # Retorna dados do usuário e token
        return success_response(
            data={
                'token': auth_result['token'],
                'user': auth_result['user']
            },
            message="Login realizado com sucesso"
        )
        
    except Exception as e:
        logger.error(f"Erro interno no login: {str(e)}")
        return error_response(
            message="Erro interno do servidor",
            code=500,
            error_code="SERVER_ERROR"
        )

@auth_bp.route('/verify', methods=['POST'])
def verify_token():
    """
    Endpoint para verificar se token é válido
    POST /api/auth/verify
    
    Headers: Authorization: Bearer <token>
    """
    try:
        # Extrai token do header Authorization
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return error_response(
                message="Token não fornecido",
                code=401,
                error_code="MISSING_TOKEN"
            )
        
        token = auth_header.split(' ')[1]
        
        # Verifica token
        payload = auth_service.verify_token(token)
        
        if not payload:
            return error_response(
                message="Token inválido ou expirado",
                code=401,
                error_code="INVALID_TOKEN"
            )
        
        return success_response(
            data={
                'valid': True,
                'user': {
                    'cdUsuario': payload.get('cd_usuario'),
                    'nomeUsuario': payload.get('nome_usuario'),
                    'cdMultiEmpresa': payload.get('cd_multi_empresa'),
                    'nomeEmpresa': payload.get('nome_empresa'),
                    'perfil': payload.get('perfil')
                }
            },
            message="Token válido"
        )
        
    except Exception as e:
        logger.error(f"Erro na verificação do token: {str(e)}")
        return error_response(
            message="Erro interno do servidor",
            code=500,
            error_code="SERVER_ERROR"
        )

@auth_bp.route('/logout', methods=['POST'])  
def logout():
    """
    Endpoint de logout
    POST /api/auth/logout
    
    Headers: Authorization: Bearer <token>
    """
    try:
        # Extrai token para log (opcional)
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            payload = auth_service.verify_token(token)
            
            if payload:
                cd_usuario = payload.get('cd_usuario')
                cd_multi_empresa = payload.get('cd_multi_empresa')
                logger.info(f"Logout realizado: {cd_usuario}@{cd_multi_empresa}")
        
        # Note: Como estamos usando JWT stateless, não há invalidação server-side
        # O frontend deve remover o token do localStorage
        
        return success_response(
            message="Logout realizado com sucesso"
        )
        
    except Exception as e:
        logger.error(f"Erro no logout: {str(e)}")
        return success_response(
            message="Logout realizado com sucesso"
        )

@auth_bp.route('/health', methods=['GET'])
def health_check():
    """
    Endpoint para verificar saúde da API de autenticação
    GET /api/auth/health
    """
    try:
        from database import db
        
        # Testa conexão com banco
        db_status = db.test_connection()
        
        return jsonify({
            'status': 'healthy' if db_status else 'unhealthy',
            'database': 'connected' if db_status else 'disconnected',
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

# Error handlers específicos do blueprint
@auth_bp.errorhandler(400)
def bad_request(error):
    return error_response(
        message="Requisição inválida",
        code=400,
        error_code="BAD_REQUEST"
    )

@auth_bp.errorhandler(401)
def unauthorized(error):
    return error_response(
        message="Não autorizado",
        code=401,
        error_code="UNAUTHORIZED"
    )

@auth_bp.errorhandler(500)
def internal_error(error):
    logger.error(f"Erro interno: {error}")
    return error_response(
        message="Erro interno do servidor",
        code=500,
        error_code="SERVER_ERROR"
    )