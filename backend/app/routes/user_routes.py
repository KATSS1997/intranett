"""
Exemplos de Rotas Protegidas com Decorators
Caminho: backend/app/routes/user_routes.py
"""

from flask import Blueprint, g
from ..auth.decorators import (
    require_auth, require_role, require_empresa, 
    optional_auth, require_admin, require_manager,
    get_current_user
)
from ..utils.responses import success_response

# Exemplo de blueprint para rotas de usuário
user_bp = Blueprint('user', __name__)

# ============================================
# 1. ROTA PROTEGIDA SIMPLES
# ============================================
@user_bp.route('/profile', methods=['GET'])
@require_auth
def get_profile():
    """Rota que precisa apenas de autenticação"""
    user = get_current_user()
    
    return success_response(
        data={
            'cdUsuario': user['cdUsuario'],
            'nomeUsuario': user['nomeUsuario'],
            'cdMultiEmpresa': user['cdMultiEmpresa'],
            'nomeEmpresa': user['nomeEmpresa'],
            'perfil': user['perfil']
        },
        message="Perfil do usuário"
    )

# ============================================
# 2. ROTA COM RESTRIÇÃO DE PERFIL
# ============================================
@user_bp.route('/admin/users', methods=['GET'])
@require_auth
@require_role(['admin', 'administrador'])
def list_all_users():
    """Apenas admins podem listar todos os usuários"""
    user = get_current_user()
    
    return success_response(
        data={'users': [], 'total': 0},
        message=f"Lista de usuários (solicitado por {user['nomeUsuario']})"
    )

# ============================================
# 3. ROTA COM RESTRIÇÃO DE EMPRESA
# ============================================
@user_bp.route('/company-data', methods=['GET'])
@require_auth
@require_empresa([1, 2, 3])  # Apenas empresas 1, 2 e 3
def get_company_data():
    """Dados específicos de certas empresas"""
    user = get_current_user()
    
    return success_response(
        data={'company_info': f'Dados da empresa {user["cdMultiEmpresa"]}'},
        message="Dados da empresa"
    )

# ============================================
# 4. MÚLTIPLAS RESTRIÇÕES COMBINADAS
# ============================================
@user_bp.route('/admin/company/<int:empresa_id>/settings', methods=['PUT'])
@require_auth
@require_role(['admin'])
@require_empresa([1])  # Apenas empresa 1 pode acessar
def update_company_settings(empresa_id):
    """Admin da empresa 1 pode alterar configurações"""
    user = get_current_user()
    
    return success_response(
        message=f"Configurações da empresa {empresa_id} atualizadas por {user['nomeUsuario']}"
    )

# ============================================
# 5. ROTA COM AUTENTICAÇÃO OPCIONAL
# ============================================
@user_bp.route('/public-info', methods=['GET'])
@optional_auth
def get_public_info():
    """Rota acessível com ou sem login"""
    user = get_current_user()
    
    if user:
        return success_response(
            data={'message': f'Olá {user["nomeUsuario"]}, você está logado!'},
            message="Informação personalizada"
        )
    else:
        return success_response(
            data={'message': 'Olá visitante anônimo!'},
            message="Informação pública"
        )

# ============================================
# 6. USANDO SHORTCUTS DE DECORATORS
# ============================================
@user_bp.route('/admin-only', methods=['GET'])
@require_auth
@require_admin
def admin_only_route():
    """Usando decorator shortcut para admin"""
    user = get_current_user()
    
    return success_response(
        message=f"Área administrativa acessada por {user['nomeUsuario']}"
    )

@user_bp.route('/management', methods=['GET'])
@require_auth
@require_manager
def management_route():
    """Usando decorator shortcut para managers+"""
    user = get_current_user()
    
    return success_response(
        message=f"Área gerencial acessada por {user['nomeUsuario']} (perfil: {user['perfil']})"
    )

# ============================================
# 7. ROTA QUE VERIFICA PERMISSÃO CUSTOMIZADA
# ============================================
@user_bp.route('/my-company-users', methods=['GET'])
@require_auth
def get_company_users():
    """Lista usuários da mesma empresa do usuário logado"""
    user = get_current_user()
    
    # Lógica customizada: só pode ver usuários da própria empresa
    user_empresa = user['cdMultiEmpresa']
    
    return success_response(
        data={
            'users': [],  # Aqui viria query filtrada por empresa
            'empresa': user_empresa,
            'solicitante': user['nomeUsuario']
        },
        message=f"Usuários da empresa {user_empresa}"
    )

# ============================================
# REGISTRAR BLUEPRINT NO APP
# ============================================
"""
Para registrar no backend/app/__init__.py:

def create_app():
    app = Flask(__name__)
    
    # ... outras configurações ...
    
    # Registrar blueprint
    from .routes.user_routes import user_bp
    app.register_blueprint(user_bp, url_prefix='/api/users')
    
    return app
"""