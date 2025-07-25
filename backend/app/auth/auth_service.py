import jwt
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dataclasses import dataclass

from database import db
from config import AppConfig

logger = logging.getLogger(__name__)

@dataclass
class UserData:
    """Dados do usuário autenticado"""
    cd_usuario: str
    nome_usuario: str
    cd_multi_empresa: int
    nome_empresa: str
    perfil: str
    ativo: bool
    ultimo_acesso: Optional[datetime] = None

class AuthService:
    """Serviço de autenticação integrado com Oracle"""
    
    def __init__(self, app_config: AppConfig):
        self.app_config = app_config
    
    def _hash_password(self, password: str) -> str:
        """Hash da senha - ajuste conforme seu padrão no Oracle"""
        # Exemplo genérico - substitua pela lógica do seu sistema
        return hashlib.sha256(password.encode()).hexdigest()
    
    def _validate_user_in_oracle(self, cd_usuario: str, password: str, cd_multi_empresa: int) -> Optional[UserData]:
        """Valida usuário/senha/empresa diretamente no Oracle"""
        try:
            # Query para validar credenciais - AJUSTE CONFORME SUA ESTRUTURA
            query = """
                SELECT 
                    u.cd_usuario,
                    u.nome_usuario,
                    u.cd_multi_empresa,
                    e.nome_empresa,
                    u.perfil,
                    u.ativo,
                    u.ultimo_acesso
                FROM usuarios u
                INNER JOIN empresas e ON u.cd_multi_empresa = e.cd_multi_empresa
                WHERE u.cd_usuario = :cd_usuario 
                  AND u.password_hash = :password_hash
                  AND u.cd_multi_empresa = :cd_multi_empresa
                  AND u.ativo = 'S'
                  AND e.ativo = 'S'
            """
            
            params = {
                'cd_usuario': cd_usuario,
                'password_hash': self._hash_password(password),
                'cd_multi_empresa': cd_multi_empresa
            }
            
            result = db.execute_query(query, params)
            
            if not result:
                logger.warning(f"Login inválido: usuário={cd_usuario}, empresa={cd_multi_empresa}")
                return None
            
            user_row = result[0]
            
            # Atualiza último acesso
            self._update_last_access(cd_usuario, cd_multi_empresa)
            
            return UserData(
                cd_usuario=user_row['cd_usuario'],
                nome_usuario=user_row['nome_usuario'],
                cd_multi_empresa=user_row['cd_multi_empresa'],
                nome_empresa=user_row['nome_empresa'],
                perfil=user_row['perfil'],
                ativo=user_row['ativo'] == 'S',
                ultimo_acesso=user_row['ultimo_acesso']
            )
            
        except Exception as e:
            logger.error(f"Erro na validação do usuário: {e}")
            return None
    
    def _update_last_access(self, cd_usuario: str, cd_multi_empresa: int) -> None:
        """Atualiza timestamp do último acesso"""
        try:
            query = """
                UPDATE usuarios 
                SET ultimo_acesso = SYSDATE 
                WHERE cd_usuario = :cd_usuario 
                  AND cd_multi_empresa = :cd_multi_empresa
            """
            
            params = {
                'cd_usuario': cd_usuario,
                'cd_multi_empresa': cd_multi_empresa
            }
            
            db.execute_dml(query, params)
            
        except Exception as e:
            logger.error(f"Erro ao atualizar último acesso: {e}")
    
    def _generate_jwt_token(self, user_data: UserData) -> str:
        """Gera token JWT com dados do usuário"""
        payload = {
            'cd_usuario': user_data.cd_usuario,
            'nome_usuario': user_data.nome_usuario,
            'cd_multi_empresa': user_data.cd_multi_empresa,
            'nome_empresa': user_data.nome_empresa,
            'perfil': user_data.perfil,
            'exp': datetime.utcnow() + timedelta(hours=self.app_config.jwt_expiration_hours),
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(payload, self.app_config.secret_key, algorithm='HS256')
        return token
    
    def authenticate(self, cd_usuario: str, password: str, cd_multi_empresa: int) -> Dict[str, Any]:
        """
        Autentica usuário e retorna token + dados
        
        Args:
            cd_usuario: Código do usuário
            password: Senha em texto plano
            cd_multi_empresa: Código da empresa
            
        Returns:
            Dict com success, token, user_data ou error
        """
        try:
            # Validações básicas
            if not cd_usuario or not password:
                return {
                    'success': False,
                    'error': 'Usuário e senha são obrigatórios',
                    'code': 'MISSING_CREDENTIALS'
                }
            
            if not cd_multi_empresa:
                return {
                    'success': False,
                    'error': 'Empresa é obrigatória',
                    'code': 'MISSING_COMPANY'
                }
            
            # Valida no Oracle
            user_data = self._validate_user_in_oracle(cd_usuario, password, cd_multi_empresa)
            
            if not user_data:
                return {
                    'success': False,
                    'error': 'Credenciais inválidas ou usuário inativo',
                    'code': 'INVALID_CREDENTIALS'
                }
            
            # Gera token JWT
            token = self._generate_jwt_token(user_data)
            
            logger.info(f"Login bem-sucedido: {cd_usuario}@{cd_multi_empresa}")
            
            return {
                'success': True,
                'token': token,
                'user': {
                    'cdUsuario': user_data.cd_usuario,
                    'nomeUsuario': user_data.nome_usuario,
                    'cdMultiEmpresa': user_data.cd_multi_empresa,
                    'nomeEmpresa': user_data.nome_empresa,
                    'perfil': user_data.perfil,
                    'ultimoAcesso': user_data.ultimo_acesso.isoformat() if user_data.ultimo_acesso else None
                }
            }
            
        except Exception as e:
            logger.error(f"Erro na autenticação: {e}")
            return {
                'success': False,
                'error': 'Erro interno do servidor',
                'code': 'SERVER_ERROR'
            }
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verifica e decodifica token JWT"""
        try:
            payload = jwt.decode(token, self.app_config.secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expirado")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Token inválido")
            return None
    
    def log_access(self, cd_usuario: str, cd_multi_empresa: int, ip_address: str, user_agent: str) -> None:
        """Registra log de acesso no Oracle"""
        try:
            query = """
                INSERT INTO logs_acesso (
                    cd_usuario, cd_multi_empresa, ip_address, 
                    user_agent, data_acesso
                ) VALUES (
                    :cd_usuario, :cd_multi_empresa, :ip_address,
                    :user_agent, SYSDATE
                )
            """
            
            params = {
                'cd_usuario': cd_usuario,
                'cd_multi_empresa': cd_multi_empresa,
                'ip_address': ip_address,
                'user_agent': user_agent
            }
            
            db.execute_dml(query, params)
            
        except Exception as e:
            logger.error(f"Erro ao registrar log de acesso: {e}")

# Instância do serviço
auth_service = AuthService(AppConfig.from_env())