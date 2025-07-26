"""
Conexão Oracle com suas configurações
Caminho: backend/app/database.py
"""

import oracledb
import logging
from contextlib import contextmanager
from typing import Optional, Any, Dict, List
from config import DatabaseConfig

logger = logging.getLogger(__name__)

class OracleDatabase:
    """Gerenciador de conexão Oracle"""
    
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self._pool: Optional[oracledb.ConnectionPool] = None
        
    def initialize_pool(self) -> None:
        """Inicializa o pool de conexões Oracle"""
        try:
            # Inicialização do Oracle Client (Modo Thick)
            try:
                oracledb.init_oracle_client(lib_dir=r"C:\oracle\instantclient_23_8")
                logger.info("✅ Oracle Instant Client inicializado (Modo Thick)")
            except oracledb.Error as error:
                logger.warning(f"⚠️ Erro ao inicializar Oracle Client: {error}")
                logger.info("🔄 Continuando em modo Thin...")
            
            # Validar configurações
            self.config.validate()
            
            # Criar pool de conexões (sem encoding que não é suportado)
            self._pool = oracledb.create_pool(
                user=self.config.username,
                password=self.config.password,
                dsn=self.config.dsn,
                min=self.config.pool_min,
                max=self.config.pool_max,
                increment=self.config.pool_increment
                # Removido: encoding (não suportado)
                # Removido: timeout (usar como parâmetro de conexão, não pool)
            )
            
            logger.info(f"✅ Pool Oracle criado: {self.config.dsn} (min={self.config.pool_min}, max={self.config.pool_max})")
            
        except oracledb.Error as e:
            logger.error(f"❌ Erro ao criar pool Oracle: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Erro inesperado ao inicializar pool: {e}")
            raise
    
    @contextmanager
    def get_connection(self):
        """Context manager para conexão do pool"""
        if not self._pool:
            raise RuntimeError("Pool não foi inicializado. Chame initialize_pool() primeiro.")
        
        connection = None
        try:
            connection = self._pool.acquire()
            logger.debug("🔄 Conexão adquirida do pool")
            yield connection
            
        except oracledb.Error as e:
            if connection:
                connection.rollback()
            logger.error(f"❌ Erro na conexão Oracle: {e}")
            raise
            
        finally:
            if connection:
                self._pool.release(connection)
                logger.debug("🔄 Conexão devolvida ao pool")
    
    def execute_query(self, query: str, params: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Executa query SELECT e retorna como lista de dicts"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute(query, params or {})
                
                # Nomes das colunas
                columns = [desc[0].lower() for desc in cursor.description]
                
                # Converte para lista de dicts
                results = []
                for row in cursor.fetchall():
                    results.append(dict(zip(columns, row)))
                
                logger.debug(f"📊 Query executada: {len(results)} registros")
                return results
                
            finally:
                cursor.close()
    
    def execute_dml(self, query: str, params: Optional[Dict] = None) -> int:
        """Executa INSERT/UPDATE/DELETE"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute(query, params or {})
                conn.commit()
                
                affected_rows = cursor.rowcount
                logger.debug(f"✏️ DML executado: {affected_rows} linhas afetadas")
                return affected_rows
                
            except Exception as e:
                conn.rollback()
                logger.error(f"❌ Erro no DML, rollback executado: {e}")
                raise
            finally:
                cursor.close()
    
    def test_connection(self) -> bool:
        """Testa se a conexão está funcionando"""
        try:
            result = self.execute_query("SELECT 1 FROM DUAL")
            success = len(result) == 1 and result[0].get('1') == 1
            
            if success:
                logger.info("✅ Teste de conexão Oracle: OK")
            else:
                logger.error("❌ Teste de conexão Oracle: FALHOU")
                
            return success
            
        except Exception as e:
            logger.error(f"❌ Teste de conexão falhou: {e}")
            return False
    
    def close_pool(self) -> None:
        """Fecha o pool de conexões"""
        if self._pool:
            self._pool.close()
            self._pool = None
            logger.info("🔒 Pool Oracle fechado")

# Instância global do banco
db = OracleDatabase(DatabaseConfig.from_env())