"""
Decorators JWT para autenticação e autorização
Caminho: backend/app/auth/decorators.py
"""

from functools import wraps
from flask import request, jsonify, g
import logging
from typing import List, Optional, Callable, Any

from .auth_service import auth_service
from ..utils.responses import error_response

logger = logging.getLogger(__name__)

def require_auth(f: Callable) -> Callable:
    """
    Decorator para proteger rotas que precisam de autenticação
    
    Usage:
        @app.route('/protected')
        @require_auth
        def protected_route():
            user = g.current_user
            return f"Hello {user['nomeUsuario']}"
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Extrai token do header Authorization
            auth_header = request.headers.get('Authorization')
            
            if not auth_header:
                logger.warning(f"Acesso negado - Token não fornecido: {request.endpoint}")
                return error_response(
                    message="Token de acesso é obrigatório",
                    code=401,
                    error_code="MISSING_TOKEN"
                )
            
            if not auth_header.startswith('Bearer '):
                logger.warning(f"Acesso negado - Formato de token inválido: {request.endpoint}")
                return error_response(
                    message="Formato do token inválido. Use: Bearer <token>",
                    code=401,
                    error_code="INVALID_TOKEN_FORMAT"
                )
            
            token = auth_header.split(' ')[1]
            
            # Verifica e decodifica token
            payload = auth_service.verify_token(token)
            
            if not payload:
                logger.warning(f"Acesso negado - Token inválido/expirado: {request.endpoint}")
                return error_response(
                    message="Token inválido ou expirado",
                    code=401,
                    error_code="INVALID_TOKEN"
                )
            
            # Armazena dados do usuário no contexto Flask (g)
            g.current_user = {
                'cdUsuario': payload.get('cd_usuario'),
                'nomeUsuario': payload.get('nome_usuario'),
                'cdMultiEmpresa': payload.get('cd_multi_empresa'),
                'nomeEmpresa': payload.get('nome_empresa'),
                'perfil': payload.get('perfil'),
                'token': token
            }
            
            # Log de acesso (sem dados sensíveis)
            logger.debug(f"Acesso autorizado: {g.current_user['cdUsuario']}@{g.current_user['cdMultiEmpresa']} -> {request.endpoint}")
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"Erro na autenticação: {str(e)}")
            return error_response(
                message="Erro interno de autenticação",
                code=500,
                error_code="AUTH_ERROR"
            )
    
    return decorated_function

def require_role(allowed_roles: List[str]) -> Callable:
    """
    Decorator para proteger rotas baseado no perfil do usuário
    
    Args:
        allowed_roles: Lista de perfis permitidos ['admin', 'user', 'manager']
    
    Usage:
        @app.route('/admin-only')
        @require_auth
        @require_role(['admin'])
        def admin_route():
            return "Área administrativa"
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # Verifica se o usuário está autenticado
                if not hasattr(g, 'current_user') or not g.current_user:
                    logger.warning(f"Acesso negado - Usuário não autenticado: {request.endpoint}")
                    return error_response(
                        message="Usuário não autenticado",
                        code=401,
                        error_code="NOT_AUTHENTICATED"
                    )
                
                user_role = g.current_user.get('perfil', '').lower()
                allowed_roles_lower = [role.lower() for role in allowed_roles]
                
                if user_role not in allowed_roles_lower:
                    logger.warning(f"Acesso negado - Perfil insuficiente: {g.current_user['cdUsuario']} (perfil: {user_role}) -> {request.endpoint}")
                    return error_response(
                        message=f"Acesso negado. Perfis permitidos: {', '.join(allowed_roles)}",
                        code=403,
                        error_code="INSUFFICIENT_ROLE"
                    )
                
                logger.debug(f"Acesso autorizado por perfil: {g.current_user['cdUsuario']} (perfil: {user_role}) -> {request.endpoint}")
                
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"Erro na verificação de perfil: {str(e)}")
                return error_response(
                    message="Erro interno de autorização",
                    code=500,
                    error_code="ROLE_ERROR"
                )
        
        return decorated_function
    return decorator

def require_empresa(empresa_codes: List[int]) -> Callable:
    """
    Decorator para restringir acesso baseado na empresa do usuário
    
    Args:
        empresa_codes: Lista de códigos de empresa permitidos [1, 2, 3]
    
    Usage:
        @app.route('/empresa-specific')
        @require_auth
        @require_empresa([1, 2])
        def empresa_route():
            return "Acesso restrito às empresas 1 e 2"
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # Verifica se o usuário está autenticado
                if not hasattr(g, 'current_user') or not g.current_user:
                    return error_response(
                        message="Usuário não autenticado",
                        code=401,
                        error_code="NOT_AUTHENTICATED"
                    )
                
                user_empresa = g.current_user.get('cdMultiEmpresa')
                
                if user_empresa not in empresa_codes:
                    logger.warning(f"Acesso negado - Empresa não permitida: {g.current_user['cdUsuario']} (empresa: {user_empresa}) -> {request.endpoint}")
                    return error_response(
                        message=f"Acesso negado para a empresa {user_empresa}",
                        code=403,
                        error_code="EMPRESA_NOT_ALLOWED"
                    )
                
                logger.debug(f"Acesso autorizado por empresa: {g.current_user['cdUsuario']} (empresa: {user_empresa}) -> {request.endpoint}")
                
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"Erro na verificação de empresa: {str(e)}")
                return error_response(
                    message="Erro interno de autorização",
                    code=500,
                    error_code="EMPRESA_ERROR"
                )
        
        return decorated_function
    return decorator

def optional_auth(f: Callable) -> Callable:
    """
    Decorator para rotas que podem ser acessadas com ou sem autenticação
    Se houver token válido, carrega dados do usuário em g.current_user
    Se não houver token ou for inválido, g.current_user será None
    
    Usage:
        @app.route('/public-or-private')
        @optional_auth
        def mixed_route():
            if g.current_user:
                return f"Hello {g.current_user['nomeUsuario']}"
            else:
                return "Hello Anonymous"
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Inicializa current_user como None
            g.current_user = None
            
            # Tenta extrair token
            auth_header = request.headers.get('Authorization')
            
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                payload = auth_service.verify_token(token)
                
                if payload:
                    g.current_user = {
                        'cdUsuario': payload.get('cd_usuario'),
                        'nomeUsuario': payload.get('nome_usuario'),
                        'cdMultiEmpresa': payload.get('cd_multi_empresa'),
                        'nomeEmpresa': payload.get('nome_empresa'),
                        'perfil': payload.get('perfil'),
                        'token': token
                    }
                    logger.debug(f"Usuário autenticado opcional: {g.current_user['cdUsuario']} -> {request.endpoint}")
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"Erro na autenticação opcional: {str(e)}")
            # Em caso de erro, continua sem autenticação
            g.current_user = None
            return f(*args, **kwargs)
    
    return decorated_function

def get_current_user() -> Optional[dict]:
    """
    Helper para obter dados do usuário atual
    
    Returns:
        Dict com dados do usuário ou None se não autenticado
    """
    return getattr(g, 'current_user', None)

def require_admin(f: Callable) -> Callable:
    """
    Decorator shortcut para rotas que precisam de perfil admin
    
    Usage:
        @app.route('/admin')
        @require_auth
        @require_admin
        def admin_only():
            return "Admin area"
    """
    return require_role(['admin', 'administrador'])(f)

def require_manager(f: Callable) -> Callable:
    """
    Decorator shortcut para rotas que precisam de perfil manager ou superior
    
    Usage:
        @app.route('/management')
        @require_auth
        @require_manager
        def manager_area():
            return "Management area"
    """
    return require_role(['admin', 'administrador', 'manager', 'gerente'])(f)