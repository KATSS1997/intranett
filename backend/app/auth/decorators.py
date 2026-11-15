# backend/app/auth/decorators.py
# --- ARQUIVO CORRIGIDO ---

from functools import wraps
from flask import request, current_app
import jwt
from app.utils.responses import error
# Corrigido: Importa a CLASSE AuthService, e não uma instância.
from .auth_service import AuthService

def token_required(f):
    """
    Decorator para proteger rotas que exigem um token de autenticação.
    Verifica a presença e a validade do token JWT no cabeçalho da requisição.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # O token é esperado no cabeçalho 'Authorization' no formato 'Bearer [token]'
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                # Extrai o token, removendo o prefixo 'Bearer '
                token = auth_header.split(" ")[1]
            except IndexError:
                return error("Cabeçalho de autorização mal formatado.", 401)

        if not token:
            return error("Token de autenticação não fornecido.", 401)

        try:
            # Decodifica o token usando a chave secreta da aplicação
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            # Você pode adicionar lógica aqui para carregar o usuário do banco de dados
            # current_user = find_user_by_id(data['sub'])
        except jwt.ExpiredSignatureError:
            return error("Token expirado. Por favor, faça login novamente.", 401)
        except jwt.InvalidTokenError:
            return error("Token inválido.", 401)

        # Passa os dados decodificados do token para a rota, se necessário
        return f(*args, **kwargs)

    return decorated

def roles_required(*roles):
    """
    Decorator para restringir o acesso a rotas com base nas roles (funções) do usuário.
    Deve ser usado DEPOIS do decorator @token_required.
    """
    def wrapper(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Esta é uma implementação de exemplo.
            # A lógica real dependeria de como as roles do usuário são armazenadas
            # e recuperadas (provavelmente a partir do token ou de uma consulta ao BD).
            
            # Exemplo de dados de usuário que poderiam vir do token:
            # user_roles = get_user_roles_from_token() 
            # if not any(role in user_roles for role in roles):
            #     return error("Acesso negado: permissões insuficientes.", 403)
            
            return f(*args, **kwargs)
        return decorated_function
    return wrapper
