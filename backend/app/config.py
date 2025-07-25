import os
from dataclasses import dataclass
from typing import Optional

@dataclass
class DatabaseConfig:
    """Configuração centralizada do banco Oracle"""
    username: str
    password: str
    dsn: str
    
    # Pool settings
    pool_min: int = 2
    pool_max: int = 10
    pool_increment: int = 1
    
    # Connection settings
    encoding: str = "UTF-8"
    timeout: int = 30
    
    @classmethod
    def from_env(cls) -> 'DatabaseConfig':
        """Carrega configurações das variáveis de ambiente"""
        return cls(
            username=os.getenv('DB_USER', 'dbamv'),
            password=os.getenv('DB_PASSWORD', 'cmdmvfbg190918'),
            dsn=os.getenv('DB_DSN', '172.16.10.7:1521/prd'),
            pool_min=int(os.getenv('ORACLE_POOL_MIN', 2)),
            pool_max=int(os.getenv('ORACLE_POOL_MAX', 10)),
            timeout=int(os.getenv('ORACLE_TIMEOUT', 30))
        )
    
    def validate(self) -> None:
        """Valida se todas as configurações obrigatórias estão presentes"""
        if not self.username:
            raise ValueError("DB_USER é obrigatório")
        if not self.password:
            raise ValueError("DB_PASSWORD é obrigatório")
        if not self.dsn:
            raise ValueError("DB_DSN é obrigatório")

@dataclass 
class AppConfig:
    """Configurações gerais da aplicação"""
    secret_key: str
    jwt_expiration_hours: int = 24
    debug: bool = False
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "logs/app.log"
    
    @classmethod
    def from_env(cls) -> 'AppConfig':
        return cls(
            secret_key=os.getenv('SECRET_KEY', 'dev-secret-change-in-production'),
            jwt_expiration_hours=int(os.getenv('JWT_EXPIRATION_HOURS', 24)),
            debug=os.getenv('FLASK_ENV') == 'development',
            log_level=os.getenv('LOG_LEVEL', 'INFO'),
            log_file=os.getenv('LOG_FILE', 'logs/app.log')
        )