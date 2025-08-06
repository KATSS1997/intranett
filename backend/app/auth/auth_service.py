"""
Serviço de autenticação DEFINITIVO para Oracle MV2000
Usa DBASGU.USUARIOS (que tem cd_senha) + DBAMV.USUARIOS (dados complementares)
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
    """Serviço de autenticação integrado com Oracle MV2000"""
    
    def __init__(self, app_config: AppConfig):
        self.app_config = app_config
    
    def _validate_user_in_oracle(self, cd_usuario: str, password: str, cd_multi_empresa: int) -> Optional[UserData]:
        """
        Valida usuário/senha no Oracle MV2000
        Usa DBASGU.USUARIOS para autenticação (tem cd_senha)
        Busca dados complementares em DBAMV.USUARIOS se necessário
        """
        try:
            logger.info(f"🔍 Validando usuário: {cd_usuario}")
            
            # QUERY PRINCIPAL: DBASGU.USUARIOS (tem cd_senha)
            auth_query = """
                SELECT 
                    u.cd_usuario,
                    u.nm_usuario,
                    u.cd_senha,
                    u.sn_ativo
                FROM dbasgu.usuarios u
                WHERE UPPER(u.cd_usuario) = UPPER(:cd_usuario)
                  AND u.cd_senha = :password
                  AND u.sn_ativo = 'S'
                  AND ROWNUM = 1
            """
            
            params = {
                'cd_usuario': cd_usuario.strip(),
                'password': password.strip()
            }
            
            logger.debug(f"🔐 Executando autenticação para: {cd_usuario}")
            
            result = db.execute_query(auth_query, params)
            
            if not result:
                logger.warning(f"❌ Credenciais inválidas para: {cd_usuario}")
                return None
            
            user_row = result[0]
            
            logger.info(f"✅ Usuário autenticado: {user_row['nm_usuario']} ({user_row['cd_usuario']})")
            
            # Busca dados complementares em DBAMV.USUARIOS (opcional)
            complementary_data = self._get_complementary_user_data(cd_usuario)
            
            # Atualiza último acesso
            self._update_last_access(cd_usuario)
            
            return UserData(
                cd_usuario=user_row['cd_usuario'],
                nome_usuario=user_row['nm_usuario'] or cd_usuario,
                cd_multi_empresa=cd_multi_empresa,
                nome_empresa=f"Empresa {cd_multi_empresa}",
                perfil=complementary_data.get('perfil', 'user'),
                ativo=user_row['sn_ativo'] == 'S',
                ultimo_acesso=None
            )
            
        except Exception as e:
            logger.error(f"❌ Erro na validação do usuário: {e}")
            return None
    
    def _get_complementary_user_data(self, cd_usuario: str) -> Dict[str, Any]:
        """Busca dados complementares em DBAMV.USUARIOS"""
        try:
            query = """
                SELECT cd_usuario, nm_usuario, tp_acesso
                FROM dbamv.usuarios 
                WHERE UPPER(cd_usuario) = UPPER(:cd_usuario)
                AND ROWNUM = 1
            """
            
            result = db.execute_query(query, {'cd_usuario': cd_usuario})
            
            if result:
                data = result[0]
                logger.debug(f"📋 Dados complementares encontrados para {cd_usuario}: {data}")
                return {
                    'perfil': data.get('tp_acesso', 'user'),
                    'nome_completo': data.get('nm_usuario')
                }
            else:
                logger.debug(f"⚠️ Dados complementares não encontrados para {cd_usuario}")
                return {}
                
        except Exception as e:
            logger.debug(f"⚠️ Erro ao buscar dados complementares: {e}")
            return {}
    
    def _update_last_access(self, cd_usuario: str) -> None:
        """Atualiza último acesso (se existir campo dt_ultimo_acesso)"""
        try:
            # Tenta atualizar em DBASGU.USUARIOS
            update_query = """
                UPDATE dbasgu.usuarios 
                SET dt_ultimo_acesso = SYSDATE 
                WHERE cd_usuario = :cd_usuario
            """
            
            affected = db.execute_dml(update_query, {'cd_usuario': cd_usuario})
            
            if affected > 0:
                logger.debug(f"📝 Último acesso atualizado: {cd_usuario}")
            else:
                logger.debug(f"⚠️ Campo dt_ultimo_acesso pode não existir para: {cd_usuario}")
                
        except Exception as e:
            logger.debug(f"⚠️ Não foi possível atualizar último acesso: {e}")
    
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
        Autentica usuário no MV2000 e retorna token + dados
        
        Args:
            cd_usuario: Código do usuário (ex: F04821, DBAMV)
            password: Senha (comparação direta com CD_SENHA do DBASGU.USUARIOS)
            cd_multi_empresa: Código da empresa
            
        Returns:
            Dict com success, token, user_data ou error
        """
        try:
            # Validações básicas
            if not cd_usuario or not password:
                logger.warning("❌ Login sem credenciais")
                return {
                    'success': False,
                    'error': 'Usuário e senha são obrigatórios',
                    'code': 'MISSING_CREDENTIALS'
                }
            
            if not cd_multi_empresa:
                logger.warning("❌ Login sem empresa")
                return {
                    'success': False,
                    'error': 'Empresa é obrigatória',
                    'code': 'MISSING_COMPANY'
                }
            
            logger.info(f"🔐 Tentativa de login: {cd_usuario}@{cd_multi_empresa}")
            
            # Valida no Oracle
            user_data = self._validate_user_in_oracle(cd_usuario, password, cd_multi_empresa)
            
            if not user_data:
                logger.warning(f"❌ Login inválido: {cd_usuario}@{cd_multi_empresa}")
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
        """Registra log de acesso"""
        try:
            logger.info(f"📝 Acesso registrado: {cd_usuario}@{cd_multi_empresa} de {ip_address}")
            # Log em arquivo é suficiente por enquanto
            
        except Exception as e:
            logger.error(f"❌ Erro ao registrar log de acesso: {e}")

# Instância do serviço
auth_service = AuthService(AppConfig.from_env())