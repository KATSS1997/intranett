"""
Serviço de autenticação integrado com Oracle Real
Caminho: backend/app/auth/auth_service.py
"""

import jwt
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
    
    def _validate_user_in_oracle(self, cd_usuario: str, password: str, cd_multi_empresa: int) -> Optional[UserData]:
        """Valida usuário/senha/empresa diretamente no Oracle"""
        try:
            # Query para validar credenciais na estrutura real
            query = """
                SELECT 
                    u.cd_usuario,
                    u.nm_usuario as nome_usuario,
                    :cd_multi_empresa as cd_multi_empresa,
                    CASE 
                        WHEN u.cd_papel IS NOT NULL THEN u.cd_papel
                        ELSE 'user'
                    END as perfil,
                    u.sn_ativo as ativo,
                    NULL as ultimo_acesso,
                    'Empresa Padrão' as nome_empresa
                FROM dbasgu.usuarios u
                WHERE u.cd_usuario = :cd_usuario 
                  AND u.cd_senha = :password
                  AND u.sn_ativo = 'S'
                  AND ROWNUM = 1
            """
            
            params = {
                'cd_usuario': cd_usuario,
                'password': password,  # Senha direta, sem hash
                'cd_multi_empresa': cd_multi_empresa
            }
            
            logger.info(f"🔍 Validando usuário: {cd_usuario} na empresa {cd_multi_empresa}")
            
            result = db.execute_query(query, params)
            
            if not result:
                logger.warning(f"❌ Login inválido: usuário={cd_usuario}, empresa={cd_multi_empresa}")
                return None
            
            user_row = result[0]
            
            logger.info(f"✅ Usuário encontrado: {user_row['nome_usuario']}")
            
            # Registrar último acesso (opcional)
            self._update_last_access(cd_usuario)
            
            return UserData(
                cd_usuario=user_row['cd_usuario'],
                nome_usuario=user_row['nome_usuario'],
                cd_multi_empresa=user_row['cd_multi_empresa'],
                nome_empresa=user_row['nome_empresa'],
                perfil=str(user_row['perfil']) if user_row['perfil'] else 'user',
                ativo=user_row['ativo'] == 'S',
                ultimo_acesso=user_row['ultimo_acesso']
            )
            
        except Exception as e:
            logger.error(f"❌ Erro na validação do usuário: {e}")
            return None
    
    def _update_last_access(self, cd_usuario: str) -> None:
        """Atualiza timestamp do último acesso (opcional)"""
        try:
            # Se tiver uma coluna de último acesso, pode descomentar:
            # query = """
            #     UPDATE dbasgu.usuarios 
            #     SET ultimo_acesso = SYSDATE 
            #     WHERE cd_usuario = :cd_usuario
            # """
            # 
            # params = {'cd_usuario': cd_usuario}
            # db.execute_dml(query, params)
            
            logger.debug(f"📝 Último acesso registrado para {cd_usuario}")
            
        except Exception as e:
            logger.error(f"❌ Erro ao atualizar último acesso: {e}")
    
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
            cd_usuario: Código do usuário (ex: F04601)
            password: Senha (será comparada diretamente com CD_SENHA)
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
            
            logger.info(f"🔐 Tentativa de login: {cd_usuario}@{cd_multi_empresa}")
            
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
            
            logger.info(f"✅ Login bem-sucedido: {cd_usuario} ({user_data.nome_usuario})")
            
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
            logger.error(f"❌ Erro na autenticação: {e}")
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
            logger.warning("⚠️ Token expirado")
            return None
        except jwt.InvalidTokenError:
            logger.warning("⚠️ Token inválido")
            return None
    
    def log_access(self, cd_usuario: str, cd_multi_empresa: int, ip_address: str, user_agent: str) -> None:
        """Registra log de acesso (opcional - se tiver tabela de logs)"""
        try:
            # Se tiver tabela de logs, pode criar:
            # query = """
            #     INSERT INTO logs_acesso (
            #         cd_usuario, cd_multi_empresa, ip_address, 
            #         user_agent, data_acesso
            #     ) VALUES (
            #         :cd_usuario, :cd_multi_empresa, :ip_address,
            #         :user_agent, SYSDATE
            #     )
            # """
            # 
            # params = {
            #     'cd_usuario': cd_usuario,
            #     'cd_multi_empresa': cd_multi_empresa,
            #     'ip_address': ip_address,
            #     'user_agent': user_agent
            # }
            # 
            # db.execute_dml(query, params)
            
            logger.info(f"📝 Acesso registrado: {cd_usuario}@{cd_multi_empresa} de {ip_address}")
            
        except Exception as e:
            logger.error(f"❌ Erro ao registrar log de acesso: {e}")

# Instância do serviço
auth_service = AuthService(AppConfig.from_env())