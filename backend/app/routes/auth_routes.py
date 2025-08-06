"""
Rotas de Autenticação - VERSÃO CORRIGIDA
Caminho: backend/app/routes/auth_routes.py
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import logging
from typing import Dict, Any
import traceback

# Imports seguros
try:
    from auth.auth_service import auth_service
    from utils.responses import success_response, error_response
    from utils.validators import validate_login_data
except ImportError as e:
    logging.warning(f"Importação falhou: {e}. Usando fallbacks...")
    
    def success_response(data=None, message="Success"):
        return jsonify({"success": True, "message": message, "data": data})
    
    def error_response(message="Error", code=400, error_code=None):
        return jsonify({"success": False, "message": message, "error_code": error_code}), code
    
    def validate_login_data(cd_usuario, password, cd_multi_empresa):
        """Validação básica de dados de login"""
        errors = []
        if not cd_usuario or not str(cd_usuario).strip():
            errors.append("Campo 'cdUsuario' é obrigatório")
        if not password or not str(password).strip():
            errors.append("Campo 'password' é obrigatório") 
        if not cd_multi_empresa:
            errors.append("Campo 'cdMultiEmpresa' é obrigatório")
        return errors[0] if errors else None
    
    # Mock do auth_service se não estiver disponível
    class MockAuthService:
        def authenticate(self, cd_usuario, password, cd_multi_empresa):
            return {
                'success': False,
                'error': 'Serviço de autenticação não configurado',
                'code': 'SERVICE_UNAVAILABLE'
            }
        def verify_token(self, token): return None
        def log_access(self, *args): pass
    
    auth_service = MockAuthService()

# Configurar logger específico
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Blueprint para rotas de autenticação
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Endpoint de login CORRIGIDO
    POST /api/auth/login
    
    Payload esperado:
    {
        "cdUsuario": "f011349",
        "password": "94450282", 
        "cdMultiEmpresa": 1
    }
    
    Response success:
    {
        "success": true,
        "message": "Login realizado com sucesso",
        "data": {
            "token": "jwt_token_here",
            "user": {...}
        }
    }
    
    Response error:
    {
        "success": false,
        "message": "Erro descritivo",
        "error_code": "CODIGO_ERRO"
    }
    """
    try:
        # 1. VALIDAR CONTENT-TYPE
        if not request.is_json:
            logger.warning(f"❌ Content-Type inválido: {request.content_type} de {request.remote_addr}")
            return error_response(
                message="Content-Type deve ser application/json",
                code=400,
                error_code="INVALID_CONTENT_TYPE"
            )
        
        # 2. CAPTURAR E VALIDAR JSON
        try:
            data = request.get_json(force=True)  # force=True para forçar parsing
        except Exception as json_error:
            logger.error(f"❌ Erro ao parsear JSON: {json_error} de {request.remote_addr}")
            return error_response(
                message="JSON inválido ou malformado",
                code=400,
                error_code="INVALID_JSON"
            )
        
        if not data:
            logger.warning(f"❌ Payload vazio de {request.remote_addr}")
            return error_response(
                message="Dados de login são obrigatórios",
                code=400,
                error_code="EMPTY_PAYLOAD"
            )
        
        # 3. EXTRAIR E VALIDAR CAMPOS
        cd_usuario = data.get('cdUsuario')
        password = data.get('password')
        cd_multi_empresa = data.get('cdMultiEmpresa')
        
        # Log SEGURO (sem expor senha)
        logger.info(f"🔐 Tentativa de login: usuário='{cd_usuario}' empresa={cd_multi_empresa} de {request.remote_addr}")
        
        # Validação detalhada
        validation_error = validate_login_data(cd_usuario, password, cd_multi_empresa)
        if validation_error:
            logger.warning(f"❌ Validação falhou: {validation_error} para usuário '{cd_usuario}'")
            return error_response(
                message=validation_error,
                code=400,
                error_code="VALIDATION_ERROR"
            )
        
        # 4. CONVERTER TIPOS SE NECESSÁRIO
        try:
            cd_multi_empresa = int(cd_multi_empresa)
        except (ValueError, TypeError):
            logger.warning(f"❌ cdMultiEmpresa inválido: {cd_multi_empresa} para usuário '{cd_usuario}'")
            return error_response(
                message="Campo 'cdMultiEmpresa' deve ser um número inteiro",
                code=400,
                error_code="INVALID_EMPRESA_TYPE"
            )
        
        # 5. AUTENTICAR NO ORACLE
        try:
            auth_result = auth_service.authenticate(
                cd_usuario=str(cd_usuario).strip().upper(),  # Normalizar para uppercase
                password=str(password).strip(),
                cd_multi_empresa=cd_multi_empresa
            )
        except Exception as auth_error:
            logger.error(f"❌ Erro interno na autenticação: {auth_error}")
            logger.error(f"❌ Stack trace: {traceback.format_exc()}")
            return error_response(
                message="Erro interno do servidor durante autenticação",
                code=500,
                error_code="AUTH_INTERNAL_ERROR"
            )
        
        # 6. PROCESSAR RESULTADO DA AUTENTICAÇÃO
        if not auth_result.get('success'):
            error_msg = auth_result.get('error', 'Credenciais inválidas')
            error_code = auth_result.get('code', 'AUTH_FAILED')
            
            logger.warning(f"❌ Autenticação falhou: {error_msg} para usuário '{cd_usuario}'")
            
            return error_response(
                message=error_msg,
                code=401 if error_code in ['INVALID_CREDENTIALS', 'USER_INACTIVE'] else 400,
                error_code=error_code
            )
        
        # 7. SUCESSO - RETORNAR TOKEN
        logger.info(f"✅ Login bem-sucedido: '{cd_usuario}' empresa={cd_multi_empresa}")
        
        # Log de acesso se disponível
        try:
            auth_service.log_access(cd_usuario, cd_multi_empresa, request.remote_addr, 'LOGIN_SUCCESS')
        except Exception:
            pass  # Não falhar por causa do log
        
        return success_response(
            data={
                'token': auth_result.get('token'),
                'user': auth_result.get('user')
            },
            message="Login realizado com sucesso"
        )
    
    except Exception as e:
        # Captura qualquer erro não tratado
        logger.error(f"❌ Erro inesperado no login: {str(e)}")
        logger.error(f"❌ Stack trace completo: {traceback.format_exc()}")
        logger.error(f"❌ Dados da requisição: headers={dict(request.headers)}, content_type={request.content_type}")
        
        return error_response(
            message="Erro interno do servidor",
            code=500,
            error_code="INTERNAL_SERVER_ERROR"
        )


@auth_bp.route('/verify', methods=['POST'])
def verify_token():
    """
    Verifica se um token JWT é válido
    POST /api/auth/verify
    
    Headers:
    Authorization: Bearer <token>
    """
    try:
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return error_response(
                message="Token não fornecido ou formato inválido",
                code=401,
                error_code="MISSING_TOKEN"
            )
        
        token = auth_header.split(' ')[1]
        
        # Verificar token
        payload = auth_service.verify_token(token)
        
        if not payload:
            return error_response(
                message="Token inválido ou expirado",
                code=401,
                error_code="INVALID_TOKEN"
            )
        
        return success_response(
            data={'user': payload},
            message="Token válido"
        )
    
    except Exception as e:
        logger.error(f"Erro na verificação do token: {str(e)}")
        return error_response(
            message="Erro interno do servidor",
            code=500,
            error_code="INTERNAL_SERVER_ERROR"
        )


@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """
    Atualiza um token JWT válido
    POST /api/auth/refresh
    """
    try:
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return error_response(
                message="Token não fornecido",
                code=401,
                error_code="MISSING_TOKEN"
            )
        
        token = auth_header.split(' ')[1]
        
        # Verificar e gerar novo token
        new_token = auth_service.refresh_token(token)
        
        if not new_token:
            return error_response(
                message="Token inválido para renovação",
                code=401,
                error_code="INVALID_REFRESH_TOKEN"
            )
        
        return success_response(
            data={'token': new_token},
            message="Token renovado com sucesso"
        )
    
    except Exception as e:
        logger.error(f"Erro na renovação do token: {str(e)}")
        return error_response(
            message="Erro interno do servidor",
            code=500,
            error_code="INTERNAL_SERVER_ERROR"
        )


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Logout do usuário (invalidar token se implementado)
    POST /api/auth/logout
    """
    try:
        # Por enquanto apenas log
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            payload = auth_service.verify_token(token)
            
            if payload:
                logger.info(f"✅ Logout realizado: usuário '{payload.get('cd_usuario')}'")
                
                # Log de acesso
                try:
                    auth_service.log_access(
                        payload.get('cd_usuario'), 
                        payload.get('cd_multi_empresa'), 
                        request.remote_addr, 
                        'LOGOUT'
                    )
                except Exception:
                    pass
        
        return success_response(message="Logout realizado com sucesso")
    
    except Exception as e:
        logger.error(f"Erro no logout: {str(e)}")
        return error_response(
            message="Erro interno do servidor",
            code=500,
            error_code="INTERNAL_SERVER_ERROR"
        )


# ===========================================
# MIDDLEWARE DE ERROR HANDLER PARA O BLUEPRINT
# ===========================================
@auth_bp.errorhandler(404)
def not_found(error):
    return error_response(
        message="Endpoint de autenticação não encontrado",
        code=404,
        error_code="AUTH_ENDPOINT_NOT_FOUND"
    )

@auth_bp.errorhandler(405)
def method_not_allowed(error):
    return error_response(
        message="Método HTTP não permitido para este endpoint",
        code=405,
        error_code="METHOD_NOT_ALLOWED"
    )

@auth_bp.errorhandler(500)
def internal_error(error):
    logger.error(f"Erro interno no blueprint auth: {error}")
    return error_response(
        message="Erro interno do servidor",
        code=500,
        error_code="INTERNAL_SERVER_ERROR"
    )