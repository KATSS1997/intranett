#!/usr/bin/env python3
"""
Servidor Flask Principal - VERSÃO CORRIGIDA
Caminho: backend/run.py
"""

import os
import sys
import logging
from pathlib import Path

# Adicionar o diretório app ao path do Python
current_dir = Path(__file__).parent
app_dir = current_dir / 'app'
sys.path.insert(0, str(app_dir))

# Configurar variáveis de ambiente se não existirem
if not os.getenv('SECRET_KEY'):
    os.environ['SECRET_KEY'] = 'dev-secret-key-mude-em-producao'

if not os.getenv('FLASK_ENV'):
    os.environ['FLASK_ENV'] = 'development'

# Configurar logging
log_dir = current_dir / 'logs'
log_dir.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(log_dir / 'server.log', mode='a', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

def main():
    """Função principal para inicializar o servidor"""
    try:
        # Importar depois de configurar o path
        from app import create_app
        
        # Criar aplicação
        app = create_app()
        
        # Configurações do servidor
        host = os.getenv('FLASK_HOST', '0.0.0.0')
        port = int(os.getenv('FLASK_PORT', 5000))
        debug = os.getenv('FLASK_ENV') == 'development'
        
        logger.info("=" * 60)
        logger.info("🚀 INICIANDO INTRANET BACKEND")
        logger.info("=" * 60)
        logger.info(f"📍 Host: {host}:{port}")
        logger.info(f"🔧 Modo: {os.getenv('FLASK_ENV', 'development')}")
        logger.info(f"🐛 Debug: {debug}")
        logger.info("=" * 60)
        
        # Inicializar servidor
        if debug:
            # Modo desenvolvimento
            app.run(
                host=host,
                port=port,
                debug=True,
                use_reloader=True,
                threaded=True
            )
        else:
            # Modo produção - usar Gunicorn
            logger.info("💡 Para produção, use: gunicorn -w 4 -b 0.0.0.0:5000 run:app")
            app.run(
                host=host,
                port=port,
                debug=False,
                threaded=True
            )
    
    except ImportError as e:
        logger.error(f"❌ Erro de importação: {e}")
        logger.error("🔧 Verifique se todas as dependências estão instaladas:")
        logger.error("   pip install -r requirements.txt")
        sys.exit(1)
    
    except Exception as e:
        logger.error(f"❌ Erro ao inicializar servidor: {e}")
        import traceback
        logger.error(f"❌ Stack trace: {traceback.format_exc()}")
        sys.exit(1)

# Para Gunicorn
try:
    from app import create_app
    app = create_app()
except Exception as e:
    logger.error(f"❌ Erro ao criar app para Gunicorn: {e}")
    raise

if __name__ == '__main__':
    main()