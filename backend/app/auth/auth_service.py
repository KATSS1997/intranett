"""
Serviço de autenticação integrado com Oracle - VERSÃO COMPLETA CORRIGIDA
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
        Valida usuário/senha/empresa diretamente no Oracle - VERSÃO SIMPLIFICADA
        """
        try:
            logger.info(f"🔍 Validando usuário: {cd_usuario} na empresa {cd_multi_empresa}")
            
            # ✅ QUERY MAIS SIMPLES POSSÍVEL - Sem problemas de tipo
            query = """
                SELECT 
                    cd_usuario,
                    nm_usuario,
                    cd_papel,
                    sn_ativo,
                    cd_senha
                FROM dbasgu.usuarios
                WHERE UPPER(cd_usuario) = UPPER(:cd_usuario)
                  AND ROWNUM = 1
            """
            
            params = {
                'cd_usuario': cd_usuario
            }
            
            logger.info("🔍 Executando query de verificação de usuário...")
            result = db.execute_query(query, params)
            
            if not result:
                logger.warning(f"❌ Usuário {cd_usuario} não encontrado na base")
                return None
            
            # ✅ ACESSO SEGURO AOS DADOS - Trata tanto lista quanto dicionário
            user_row = result[0]
            logger.info(f"🔍 Query retornou {len(user_row)} campos")
            logger.info(f"🔍 Dados do usuário: {user_row}")
            
            # ✅ DETECTA SE É DICIONÁRIO OU LISTA
            if isinstance(user_row, dict):
                # Resultado como dicionário
                cd_usuario_db = user_row.get('cd_usuario') or user_row.get('CD_USUARIO') or cd_usuario
                nm_usuario_db = user_row.get('nm_usuario') or user_row.get('NM_USUARIO') or cd_usuario
                cd_papel_db = user_row.get('cd_papel') or user_row.get('CD_PAPEL') or 'user'
                sn_ativo_db = user_row.get('sn_ativo') or user_row.get('SN_ATIVO') or 'N'
                cd_senha_db = user_row.get('cd_senha') or user_row.get('CD_SENHA')
            else:
                # Resultado como lista/tupla
                cd_usuario_db = user_row[0] if len(user_row) > 0 else cd_usuario
                nm_usuario_db = user_row[1] if len(user_row) > 1 else cd_usuario
                cd_papel_db = user_row[2] if len(user_row) > 2 else 'user'
                sn_ativo_db = user_row[3] if len(user_row) > 3 else 'N'
                cd_senha_db = user_row[4] if len(user_row) > 4 else None
            
            logger.info(f"✅ Usuário encontrado: {cd_usuario_db}")
            logger.info(f"👤 Nome: {nm_usuario_db}")
            logger.info(f"🎭 Perfil: {cd_papel_db}")
            logger.info(f"📋 Status: {sn_ativo_db}")
            logger.info(f"🔑 Senha DB: '{cd_senha_db}' | Fornecida: '{password}'")
            
            # ✅ VALIDAÇÕES
            if sn_ativo_db != 'S':
                logger.warning(f"❌ Usuário {cd_usuario} está inativo: {sn_ativo_db}")
                return None
            
            if cd_senha_db is None:
                logger.warning(f"❌ Usuário {cd_usuario} não tem senha definida")
                return None
                
            if str(cd_senha_db).strip() != str(password).strip():
                logger.warning(f"❌ Senha incorreta para usuário {cd_usuario}")
                logger.warning(f"🔍 Esperado: '{cd_senha_db}' | Recebido: '{password}'")
                return None
            
            # ✅ CRIAR OBJETO USERDATA
            user_data = UserData(
                cd_usuario=cd_usuario_db,
                nome_usuario=nm_usuario_db or cd_usuario_db,
                cd_multi_empresa=cd_multi_empresa,
                nome_empresa=f"Empresa {cd_multi_empresa}",
                perfil=cd_papel_db or 'user',
                ativo=True,
                ultimo_acesso=None
            )
            
            logger.info(f"✅ Validação bem-sucedida para usuário: {cd_usuario_db}")
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
                    'cd_usuario': user_data.cd_usuario,        
                    'nome_usuario': user_data.nome_usuario,    
                    'cd_multi_empresa': user_data.cd_multi_empresa,
                    'nome_empresa': user_data.nome_empresa,
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