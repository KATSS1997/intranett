# backend/app/auth/auth_service.py
# VERSÃO SIMPLIFICADA COM USUÁRIO DE TESTE

import jwt
from datetime import datetime, timedelta, timezone
from flask import current_app
from app.exceptions.auth_exceptions import InvalidCredentialsError

class AuthService:
    
    # 🧪 USUÁRIO DE TESTE HARDCODED
    TEST_USER = {
        'usuario': 'admin',
        'senha': 'admin123',
        'nome': 'Administrador Teste',
        'perfil': 'admin',
        'empresa': 1
    }
    
    @staticmethod
    def generate_token(user_data):
        """Gera token JWT"""
        try:
            payload = {
                'exp': datetime.now(timezone.utc) + timedelta(hours=24),
                'iat': datetime.now(timezone.utc),
                'sub': user_data['usuario'],
                'nome': user_data['nome'],
                'perfil': user_data['perfil'],
                'empresa': user_data['empresa']
            }
            return jwt.encode(
                payload,
                current_app.config['SECRET_KEY'],
                algorithm='HS256'
            )
        except Exception as e:
            print(f"❌ Erro ao gerar token: {e}")
            raise
    
    @staticmethod
    def login_with_baleia_api(username, password):
        """
        Autentica usando usuário de teste.
        Username: admin
        Password: admin123
        """
        print(f"🔐 Tentativa de login: {username}")
        
        # Verifica se é o usuário de teste
        if (username.lower() == AuthService.TEST_USER['usuario'].lower() and 
            password == AuthService.TEST_USER['senha']):
            
            print(f"✅ Login bem-sucedido: {username}")
            
            # Gera token
            token = AuthService.generate_token(AuthService.TEST_USER)
            
            return {
                "token": token,
                "userDataFromApi": {
                    "cdUsuario": AuthService.TEST_USER['usuario'],
                    "nomeUsuario": AuthService.TEST_USER['nome'],
                    "perfil": AuthService.TEST_USER['perfil'],
                    "cdMultiEmpresa": AuthService.TEST_USER['empresa'],
                    "nomeEmpresa": "Empresa Teste LTDA"
                }
            }
        
        # Se não for o usuário de teste, retorna erro
        print(f"❌ Credenciais inválidas para: {username}")
        raise InvalidCredentialsError("Usuário ou senha incorretos")