"""
Validadores para entrada de dados
Caminho: backend/app/utils/validators.py
"""

import re
from typing import Optional

def validate_login_data(cd_usuario: str, password: str, cd_multi_empresa: int) -> Optional[str]:
    """
    Valida dados de login
    
    Returns:
        None se válido, string com erro se inválido
    """
    
    # Validação do usuário
    if not cd_usuario:
        return "Código do usuário é obrigatório"
    
    if not isinstance(cd_usuario, str):
        return "Código do usuário deve ser texto"
    
    if len(cd_usuario.strip()) == 0:
        return "Código do usuário não pode estar vazio"
    
    if len(cd_usuario) > 50:
        return "Código do usuário muito longo (máximo 50 caracteres)"
    
    # Validação da senha
    if not password:
        return "Senha é obrigatória"
    
    if not isinstance(password, str):
        return "Senha deve ser texto"
    
    if len(password.strip()) == 0:
        return "Senha não pode estar vazia"
    
    if len(password) < 3:
        return "Senha muito curta (mínimo 3 caracteres)"
    
    if len(password) > 100:
        return "Senha muito longa (máximo 100 caracteres)"
    
    # Validação da empresa
    if cd_multi_empresa is None:
        return "Código da empresa é obrigatório"
    
    if not isinstance(cd_multi_empresa, int):
        return "Código da empresa deve ser numérico"
    
    if cd_multi_empresa <= 0:
        return "Código da empresa deve ser maior que zero"
    
    if cd_multi_empresa > 999999:
        return "Código da empresa inválido"
    
    return None

def validate_user_code(cd_usuario: str) -> bool:
    """Valida formato do código de usuário"""
    if not cd_usuario:
        return False
    
    # Permite letras, números e alguns caracteres especiais
    pattern = r'^[a-zA-Z0-9._-]+$'
    return bool(re.match(pattern, cd_usuario))

def validate_empresa_code(cd_multi_empresa: int) -> bool:
    """Valida código da empresa"""
    return isinstance(cd_multi_empresa, int) and 1 <= cd_multi_empresa <= 999999

def sanitize_string(value: str, max_length: int = 255) -> str:
    """Sanitiza string removendo caracteres perigosos"""
    if not isinstance(value, str):
        return ""
    
    # Remove caracteres de controle e limita tamanho
    sanitized = ''.join(char for char in value if ord(char) >= 32)
    return sanitized[:max_length].strip()

def validate_ip_address(ip: str) -> bool:
    """Valida formato de IP address"""
    if not ip:
        return False
    
    # Regex simples para IPv4
    pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
    if not re.match(pattern, ip):
        return False
    
    # Verifica se cada octeto está entre 0-255
    octets = ip.split('.')
    for octet in octets:
        if not (0 <= int(octet) <= 255):
            return False
    
    return True