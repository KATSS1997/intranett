# backend/app/database.py
# --- ARQUIVO CORRIGIDO ---

import oracledb
from flask import g

def get_db():
    """
    Cria e retorna uma nova conexão com o banco de dados para a requisição atual.
    A conexão é armazenada no objeto 'g' do Flask para ser reutilizada
    durante o mesmo request, evitando múltiplas conexões.
    """
    if 'db' not in g:
        from flask import current_app
        try:
            # Pega as credenciais do arquivo de configuração
            g.db = oracledb.connect(
                user=current_app.config['ORACLE_USER'],
                password=current_app.config['ORACLE_PASSWORD'],
                dsn=current_app.config['ORACLE_DSN']
            )
        except oracledb.Error as e:
            # Em caso de erro na conexão, loga a mensagem e para a aplicação
            print(f"Erro ao conectar ao Oracle: {e}")
            raise
    return g.db

def close_db(e=None):
    """
    Fecha a conexão com o banco de dados ao final da requisição.
    """
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db(app):
    """
    Inicializa o banco de dados registrando o comando de fechamento da conexão.
    Esta função é chamada pela fábrica de aplicação em __init__.py.
    """
    # Garante que a conexão seja fechada após cada requisição
    app.teardown_appcontext(close_db)

