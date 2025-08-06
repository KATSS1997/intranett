"""
Utilitários de validação de dados
Caminho: backend/app/utils/validators.py
"""

import re
from typing import Optional, Dict, List, Any

def validate_login_data(cd_usuario: Any, password: Any, cd_multi_empresa: Any) -> Optional[str]:
    """
    Valida dados de login
    
    Args:
        cd_usuario: Código do usuário
        password: Senha
        cd_multi_empresa: Código da empresa
    
    Returns:
        None se válido, ou string com mensagem de erro
    """
    # Validar cd_usuario
    if not cd_usuario:
        return "Campo 'cdUsuario' é obrigatório"
    
    cd_usuario_str = str(cd_usuario).strip()
    if not cd_usuario_str:
        return "Campo 'cdUsuario' não pode estar vazio"
    
    if len(cd_usuario_str) > 30:
        return "Campo 'cdUsuario' deve ter no máximo 30 caracteres"
    
    # Validar se contém apenas caracteres válidos (alphanumeric + underscore)
    if not re.match(r'^[A-Za-z0-9_]+$', cd_usuario_str):
        return "Campo 'cdUsuario' deve conter apenas letras, números e underscore"
    
    # Validar password
    if not password:
        return "Campo 'password' é obrigatório"
    
    password_str = str(password).strip()
    if not password_str:
        return "Campo 'password' não pode estar vazio"
    
    if len(password_str) > 100:
        return "Campo 'password' muito longo"
    
    # Validar cd_multi_empresa
    if cd_multi_empresa is None:
        return "Campo 'cdMultiEmpresa' é obrigatório"
    
    try:
        empresa_int = int(cd_multi_empresa)
        if empresa_int <= 0:
            return "Campo 'cdMultiEmpresa' deve ser um número positivo"
        if empresa_int > 9999:
            return "Campo 'cdMultiEmpresa' deve ser menor que 10000"
    except (ValueError, TypeError):
        return "Campo 'cdMultiEmpresa' deve ser um número inteiro"
    
    return None

def validate_required_fields(data: Dict, required_fields: List[str]) -> Dict[str, str]:
    """
    Valida se campos obrigatórios estão presentes
    
    Args:
        data: Dicionário com dados
        required_fields: Lista de campos obrigatórios
    
    Returns:
        Dict com erros (vazio se tudo OK)
    """
    errors = {}
    
    for field in required_fields:
        if field not in data:
            errors[field] = f"Campo '{field}' é obrigatório"
        elif data[field] is None:
            errors[field] = f"Campo '{field}' não pode ser nulo"
        elif isinstance(data[field], str) and not data[field].strip():
            errors[field] = f"Campo '{field}' não pode estar vazio"
    
    return errors

def validate_email(email: str) -> bool:
    """Valida formato de email"""
    if not email:
        return False
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_string_length(value: str, min_length: int = 0, max_length: int = 255) -> Optional[str]:
    """Valida comprimento de string"""
    if not isinstance(value, str):
        return "Valor deve ser uma string"
    
    if len(value) < min_length:
        return f"Deve ter pelo menos {min_length} caracteres"
    
    if len(value) > max_length:
        return f"Deve ter no máximo {max_length} caracteres"
    
    return None

def validate_integer_range(value: Any, min_value: int = None, max_value: int = None) -> Optional[str]:
    """Valida se valor é inteiro e está dentro do range"""
    try:
        int_value = int(value)
    except (ValueError, TypeError):
        return "Valor deve ser um número inteiro"
    
    if min_value is not None and int_value < min_value:
        return f"Valor deve ser maior ou igual a {min_value}"
    
    if max_value is not None and int_value > max_value:
        return f"Valor deve ser menor ou igual a {max_value}"
    
    return None

def sanitize_string(value: str) -> str:
    """Remove espaços e caracteres especiais perigosos"""
    if not isinstance(value, str):
        return str(value)
    
    # Remove espaços nas extremidades
    value = value.strip()
    
    # Remove caracteres de controle
    value = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', value)
    
    return value

def validate_json_payload(data: Dict, schema: Dict) -> Dict[str, str]:
    """
    Valida payload JSON contra um schema simples
    
    Args:
        data: Dados a validar
        schema: Schema com regras
        
    Example schema:
    {
        "cdUsuario": {"required": True, "type": "string", "max_length": 30},
        "password": {"required": True, "type": "string", "min_length": 1},
        "cdMultiEmpresa": {"required": True, "type": "integer", "min": 1}
    }
    """
    errors = {}
    
    for field, rules in schema.items():
        value = data.get(field)
        
        # Verificar se é obrigatório
        if rules.get("required", False):
            if value is None or (isinstance(value, str) and not value.strip()):
                errors[field] = f"Campo '{field}' é obrigatório"
                continue
        
        # Se campo não está presente e não é obrigatório, pular
        if value is None:
            continue
        
        # Verificar tipo
        expected_type = rules.get("type")
        if expected_type == "string" and not isinstance(value, str):
            errors[field] = f"Campo '{field}' deve ser uma string"
        elif expected_type == "integer":
            try:
                int(value)
            except (ValueError, TypeError):
                errors[field] = f"Campo '{field}' deve ser um número inteiro"
        
        # Verificar comprimento (strings)
        if isinstance(value, str):
            min_length = rules.get("min_length")
            max_length = rules.get("max_length")
            
            if min_length and len(value) < min_length:
                errors[field] = f"Campo '{field}' deve ter pelo menos {min_length} caracteres"
            
            if max_length and len(value) > max_length:
                errors[field] = f"Campo '{field}' deve ter no máximo {max_length} caracteres"
        
        # Verificar range (inteiros)
        if expected_type == "integer":
            try:
                int_value = int(value)
                min_val = rules.get("min")
                max_val = rules.get("max")
                
                if min_val is not None and int_value < min_val:
                    errors[field] = f"Campo '{field}' deve ser maior ou igual a {min_val}"
                
                if max_val is not None and int_value > max_val:
                    errors[field] = f"Campo '{field}' deve ser menor ou igual a {max_val}"
            except (ValueError, TypeError):
                pass  # Erro já capturado na validação de tipo
    
    return errors