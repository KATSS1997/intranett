class AuthException(Exception):
    pass

class InvalidCredentialsException(AuthException):
    pass

class TokenExpiredException(AuthException):
    pass

class TokenInvalidException(AuthException):
    pass
