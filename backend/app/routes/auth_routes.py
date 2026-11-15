# backend/app/routes/auth_routes.py

from flask import Blueprint, request, jsonify
from app.auth.auth_service import AuthService
from app.exceptions.auth_exceptions import InvalidCredentialsError

# Cria o Blueprint para rotas de autenticação
auth_bp = Blueprint('auth_routes', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Endpoint de login
    Body esperado: {"usuario": "admin", "senha": "admin123", "empresa": 1}
    ou {"cdUsuario": "admin", "password": "admin123", "cdMultiEmpresa": 1}
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados não fornecidos'
            }), 400
        
        # Suporta múltiplos formatos de chaves
        username = data.get('usuario') or data.get('cdUsuario') or data.get('username')
        password = data.get('senha') or data.get('password')
        
        # Validação básica
        if not username or not password:
            return jsonify({
                'success': False,
                'error': 'Usuário e senha são obrigatórios'
            }), 400
        
        print(f"🔐 Tentativa de login: {username}")
        
        # Chama o serviço de autenticação
        result = AuthService.login_with_baleia_api(username, password)
        
        print(f"✅ Login bem-sucedido: {username}")
        
        # Retorna resposta no formato esperado
        return jsonify({
            'success': True,
            'token': result['token'],
            'user': result['userDataFromApi']
        }), 200
        
    except InvalidCredentialsError as e:
        print(f"❌ Credenciais inválidas")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 401
        
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Endpoint de logout
    """
    try:
        print("✅ Logout realizado")
        return jsonify({
            'success': True,
            'message': 'Logout realizado com sucesso'
        }), 200
    except Exception as e:
        print(f"❌ Erro no logout: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro ao realizar logout'
        }), 500

@auth_bp.route('/test', methods=['GET'])
def test():
    """
    Endpoint de teste para verificar se a API está funcionando
    """
    return jsonify({
        'success': True,
        'message': 'API de autenticação funcionando!',
        'usuario_teste': {
            'usuario': 'admin',
            'senha': 'admin123',
            'empresa': 1
        }
    }), 200

@auth_bp.route('/verify', methods=['GET', 'POST'])
def verify():
    """
    Endpoint para verificar token (opcional - para uso futuro)
    """
    try:
        return jsonify({
            'success': True,
            'valid': True,
            'message': 'Token válido'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'valid': False,
            'error': str(e)
        }), 401