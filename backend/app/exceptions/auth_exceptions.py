# backend/app/exceptions/auth_exceptions.py
# --- ARQUIVO CORRIGIDO ---

class AuthError(Exception):
    """Classe base para exceções de autenticação."""
    pass

class InvalidCredentialsError(AuthError):
    """Exceção para credenciais inválidas."""
    pass

class TokenExpiredError(AuthError):
    """Exceção para token expirado."""
    pass

class InvalidTokenError(AuthError):
    """Exceção para token inválido."""
    pass

