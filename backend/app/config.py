# backend/app/config.py
# --- ARQUIVO DE CONFIGURAÇÃO CENTRALIZADO ---

import os
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env na raiz do backend
load_dotenv()

class Config:
    """
    Configurações base da aplicação.
    Lê variáveis de um arquivo .env para segurança e flexibilidade.
    """
    # Chave secreta para assinar tokens JWT e sessões.
    # É crucial que seja secreta e complexa em produção.
    SECRET_KEY = os.getenv('SECRET_KEY', 'uma-chave-secreta-padrao-para-desenvolvimento')
    
    # Configurações do Banco de Dados Oracle
    ORACLE_USER = os.getenv('ORACLE_USER')
    ORACLE_PASSWORD = os.getenv('ORACLE_PASSWORD')
    ORACLE_DSN = os.getenv('ORACLE_DSN')
    
    # Configurações do Token JWT
    JWT_EXPIRATION_DAYS = int(os.getenv('JWT_EXPIRATION_DAYS', 1))

    # URL da API externa para autenticação
    BALEIA_API_URL = os.getenv('BALEIA_API_URL', "http://172.40.0.18:8081/baleia_apis/auth/login")
