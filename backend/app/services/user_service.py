# backend/app/services/user_service.py
# --- ARQUIVO CORRIGIDO ---

from app.database import get_db

# Corrigido: O nome da classe foi alterado para 'UserService' (padrão PascalCase)
class UserService:
    @staticmethod
    def get_all_users():
        """
        Busca todos os usuários no banco de dados.
        """
        db = get_db()
        cursor = db.cursor()
        # É uma boa prática listar as colunas para evitar buscar dados desnecessários
        cursor.execute("SELECT id, username, email, role FROM users")
        
        # Converte o resultado em uma lista de dicionários para facilitar a conversão para JSON
        columns = [col[0].lower() for col in cursor.description]
        users = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        cursor.close()
        return users

    @staticmethod
    def get_user_by_id(user_id):
        """
        Busca um usuário específico pelo seu ID.
        """
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT id, username, email, role FROM users WHERE id = :id", {'id': user_id})
        
        columns = [col[0].lower() for col in cursor.description]
        row = cursor.fetchone()
        
        cursor.close()
        
        # Retorna o usuário como um dicionário se encontrado, caso contrário, retorna None
        if row:
            return dict(zip(columns, row))
        return None

