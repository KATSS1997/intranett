"""
Serviço de autenticação integrado com Oracle - SENHA EM TEXTO PLANO
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
        """
        Valida usuário/senha/empresa diretamente no Oracle
        COMPARAÇÃO DIRETA - SEM HASH
        """
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
                    me.nm_razao_social as nome_empresa
                FROM dbasgu.usuarios u
                LEFT JOIN dbamv.multi_empresas me ON me.cd_multi_empresa = :cd_multi_empresa
                WHERE UPPER(u.cd_usuario) = UPPER(:cd_usuario)
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
                logger.warning(f"❌ Credenciais inválidas para usuário: {cd_usuario}")
                return None
            
            row = result[0]
            
            # Criar objeto UserData
            user_data = UserData(
                cd_usuario=row[0],
                nome_usuario=row[1] or cd_usuario,  # Fallback se nome for null
                cd_multi_empresa=row[2],
                nome_empresa=row[6] or f"Empresa {cd_multi_empresa}",  # Fallback se nome empresa for null
                perfil=row[3] or 'user',
                ativo=row[4] == 'S',
                ultimo_acesso=None
            )
            
            logger.info(f"✅ Usuário validado: {cd_usuario} ({user_data.nome_usuario})")
            return user_data
            
        except Exception as e:
            logger.error(f"❌ Erro na validação Oracle: {str(e)}")
            import traceback
            logger.error(f"❌ Stack trace: {traceback.format_exc()}")
            return None
    
    def _generate_jwt_token(self, user_data: UserData) -> str:
        """Gera token JWT com dados do usuário"""
        payload = {
            'cd_usuario': user_data.cd_usuario,
            'nome_usuario': user_data.nome_usuario,
            'cd_multi_empresa': user_data.cd_multi_empresa,
            'nome_empresa': user_data.nome_empresa,
            'perfil': user_data.perfil,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=self.app_config.jwt_expiration_hours)
        }
        
        token = jwt.encode(payload, self.app_config.secret_key, algorithm='HS256')
        return token
    
    def authenticate(self, cd_usuario: str, password: str, cd_multi_empresa: int) -> Dict[str, Any]:
        """
        Autentica usuário e retorna token + dados
        
        Args:
            cd_usuario: Código do usuário (ex: F04601)
            password: Senha em texto plano (comparação direta)
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
            
            # Valida no Oracle COM TEXTO PLANO
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
                    'perfil': user_data.perfil
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Erro na autenticação: {str(e)}")
            import traceback
            logger.error(f"❌ Stack trace completo: {traceback.format_exc()}")
            return {
                'success': False,
                'error': 'Erro interno do servidor',
                'code': 'INTERNAL_ERROR'
            }
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verifica e decodifica token JWT"""
        try:
            payload = jwt.decode(token, self.app_config.secret_key, algorithms=['HS256'])
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.warning("❌ Token expirado")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"❌ Token inválido: {e}")
            return None
    
    def refresh_token(self, old_token: str) -> Optional[str]:
        """Renova token JWT se válido"""
        payload = self.verify_token(old_token)
        
        if not payload:
            return None
        
        # Remove timestamps antigos
        payload.pop('iat', None)
        payload.pop('exp', None)
        
        # Adiciona novos timestamps
        payload['iat'] = datetime.utcnow()
        payload['exp'] = datetime.utcnow() + timedelta(hours=self.app_config.jwt_expiration_hours)
        
        return jwt.encode(payload, self.app_config.secret_key, algorithm='HS256')
    
    def log_access(self, cd_usuario: str, cd_multi_empresa: int, ip: str, user_agent: str = None):
        """Log de acesso do usuário"""
        try:
            logger.info(f"📋 Access Log: {cd_usuario}@{cd_multi_empresa} from {ip}")
            
            # Opcional: salvar em tabela de auditoria se existir
            try:
                audit_query = """
                    INSERT INTO log_acessos (
                        cd_usuario, 
                        cd_multi_empresa, 
                        ip_address, 
                        user_agent, 
                        data_acesso,
                        tipo_acao
                    ) VALUES (
                        :cd_usuario,
                        :cd_multi_empresa,
                        :ip_address,
                        :user_agent,
                        SYSDATE,
                        'LOGIN'
                    )
                """
                
                audit_params = {
                    'cd_usuario': cd_usuario,
                    'cd_multi_empresa': cd_multi_empresa,
                    'ip_address': ip,
                    'user_agent': user_agent or 'Unknown'
                }
                
                db.execute_query(audit_query, audit_params, commit=True)
                logger.debug(f"✅ Log de auditoria salvo para {cd_usuario}")
                
            except Exception as audit_error:
                # Não falhar se tabela de auditoria não existir
                logger.debug(f"⚠️ Tabela de auditoria não encontrada: {audit_error}")
            
        except Exception as e:
            logger.warning(f"⚠️ Erro no log de acesso: {e}")

# Instância global do serviço (será inicializada no app)
auth_service = None

def initialize_auth_service():
    """Inicializa o serviço de autenticação"""
    global auth_service
    try:
        app_config = AppConfig.from_env()
        auth_service = AuthService(app_config)
        logger.info("✅ Serviço de autenticação inicializado")
        return auth_service
    except Exception as e:
        logger.error(f"❌ Erro ao inicializar auth service: {e}")
        raise

# Inicializar automaticamente
if auth_service is None:
    try:
        initialize_auth_service()
    except Exception as e:
        logger.warning(f"⚠️ Auth service não inicializado: {e}")
        # Criar mock para evitar erros
        class MockAuthService:
            def authenticate(self, cd_usuario, password, cd_multi_empresa):
                return {
                    'success': False,
                    'error': 'Serviço de autenticação não configurado',
                    'code': 'SERVICE_UNAVAILABLE'
                }
            def verify_token(self, token): return None
            def refresh_token(self, token): return None
            def log_access(self, *args): pass
        
        auth_service = MockAuthService()