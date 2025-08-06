"""
Utilitários para respostas padronizadas da API
Caminho: backend/app/utils/responses.py
"""

from flask import jsonify
from typing import Any, Dict, Optional
from datetime import datetime

def success_response(data: Optional[Any] = None, message: str = "Operação realizada com sucesso") -> Dict:
    """
    Padroniza respostas de sucesso da API
    
    Args:
        data: Dados a serem retornados
        message: Mensagem de sucesso
    
    Returns:
        Response JSON padronizada
    """
    response = {
        "success": True,
        "message": message,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    if data is not None:
        response["data"] = data
    
    return jsonify(response)

def error_response(
    message: str = "Erro na operação", 
    code: int = 400, 
    error_code: Optional[str] = None,
    details: Optional[Dict] = None
) -> tuple:
    """
    Padroniza respostas de erro da API
    
    Args:
        message: Mensagem de erro amigável
        code: Código HTTP (400, 401, 403, 404, 500, etc)
        error_code: Código interno do erro (para o frontend tratar)
        details: Detalhes adicionais do erro
    
    Returns:
        Tupla (response_json, status_code)
    """
    response = {
        "success": False,
        "message": message,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    if error_code:
        response["error_code"] = error_code
    
    if details:
        response["details"] = details
    
    return jsonify(response), code

def validation_error_response(errors: Dict[str, str]) -> tuple:
    """
    Resposta específica para erros de validação
    
    Args:
        errors: Dict com campo -> mensagem de erro
        
    Example:
        errors = {
            "cdUsuario": "Campo obrigatório",
            "password": "Deve ter pelo menos 6 caracteres"
        }
    """
    return error_response(
        message="Dados inválidos",
        code=400,
        error_code="VALIDATION_ERROR",
        details={"validation_errors": errors}
    )

def unauthorized_response(message: str = "Acesso negado") -> tuple:
    """Resposta padronizada para erro 401"""
    return error_response(
        message=message,
        code=401,
        error_code="UNAUTHORIZED"
    )

def forbidden_response(message: str = "Permissão insuficiente") -> tuple:
    """Resposta padronizada para erro 403"""
    return error_response(
        message=message,
        code=403,
        error_code="FORBIDDEN"
    )

def not_found_response(resource: str = "Recurso") -> tuple:
    """Resposta padronizada para erro 404"""
    return error_response(
        message=f"{resource} não encontrado",
        code=404,
        error_code="NOT_FOUND"
    )

def internal_error_response(message: str = "Erro interno do servidor") -> tuple:
    """Resposta padronizada para erro 500"""
    return error_response(
        message=message,
        code=500,
        error_code="INTERNAL_SERVER_ERROR"
    )