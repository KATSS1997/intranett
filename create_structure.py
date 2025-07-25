#!/usr/bin/env python3
"""
Script para criar a estrutura completa de pastas da Intranet Fullstack
Execute: python create_structure.py
"""

import os
from pathlib import Path

def create_file(filepath: str, content: str = ""):
    """Cria arquivo com conteúdo"""
    file_path = Path(filepath)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    if not file_path.exists():
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Criado: {filepath}")
    else:
        print(f"⚠️  Já existe: {filepath}")

def create_structure():
    """Cria toda a estrutura de pastas e arquivos iniciais"""
    
    print("🚀 Criando estrutura da Intranet Fullstack...\n")
    
    # ===========================================
    # BACKEND STRUCTURE
    # ===========================================
    print("📁 BACKEND - Criando estrutura Flask...")
    
    # Root files
    create_file("backend/.env", """# Oracle Database
DB_USER=dbamv
DB_PASSWORD=cmdmvfbg190918
DB_DSN=172.16.10.7:1521/prd

# App Config
SECRET_KEY=sua_chave_jwt_super_secreta_mude_em_producao
JWT_EXPIRATION_HOURS=24
FLASK_ENV=development
LOG_LEVEL=INFO
""")
    
    create_file("backend/requirements.txt", """Flask==2.3.3
python-oracledb==1.4.2
PyJWT==2.8.0
python-dotenv==1.0.0
Flask-CORS==4.0.0
gunicorn==21.2.0
""")
    
    create_file("backend/run.py", """#!/usr/bin/env python3
from app import create_app
from app.database import db

app = create_app()

if __name__ == '__main__':
    # Inicializa pool de conexões
    db.initialize_pool()
    
    # Testa conexão
    if db.test_connection():
        print("✅ Conectado ao Oracle")
    else:
        print("❌ Erro na conexão Oracle")
        exit(1)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
""")
    
    # App module
    create_file("backend/app/__init__.py", """from flask import Flask
from flask_cors import CORS
import logging

def create_app():
    app = Flask(__name__)
    
    # Configurações
    from .config import AppConfig
    config = AppConfig.from_env()
    app.config['SECRET_KEY'] = config.secret_key
    
    # CORS
    CORS(app, origins=["http://localhost:3000"])
    
    # Logging
    logging.basicConfig(level=logging.INFO)
    
    # Registrar blueprints
    from .routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    return app
""")
    
    # Core files (já criados anteriormente)
    create_file("backend/app/config.py", "# Arquivo já criado anteriormente")
    create_file("backend/app/database.py", "# Arquivo já criado anteriormente")
    
    # Auth module
    create_file("backend/app/auth/__init__.py", "")
    create_file("backend/app/auth/auth_service.py", "# Arquivo já criado anteriormente")
    create_file("backend/app/auth/decorators.py", "# Próximo passo")
    create_file("backend/app/auth/middleware.py", "# Middleware de autenticação")
    
    # Routes
    create_file("backend/app/routes/__init__.py", "")
    create_file("backend/app/routes/auth_routes.py", "# Próximo passo")
    create_file("backend/app/routes/user_routes.py", "# Rotas de usuários")
    create_file("backend/app/routes/dashboard_routes.py", "# Rotas do dashboard")
    
    # Models
    create_file("backend/app/models/__init__.py", "")
    create_file("backend/app/models/user_model.py", "# Modelo de usuário")
    create_file("backend/app/models/empresa_model.py", "# Modelo de empresa")
    
    # Services
    create_file("backend/app/services/__init__.py", "")
    create_file("backend/app/services/user_service.py", "# Serviços de usuário")
    create_file("backend/app/services/empresa_service.py", "# Serviços de empresa")
    
    # Utils
    create_file("backend/app/utils/__init__.py", "")
    create_file("backend/app/utils/logger.py", """import logging
import logging.handlers
import os

def setup_logger(name: str, log_file: str, level=logging.INFO):
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create logs directory if it doesn't exist
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    
    handler = logging.handlers.RotatingFileHandler(
        log_file, maxBytes=10*1024*1024, backupCount=5
    )
    handler.setFormatter(formatter)
    
    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.addHandler(handler)
    
    return logger
""")
    create_file("backend/app/utils/validators.py", "# Validadores")
    create_file("backend/app/utils/responses.py", """from flask import jsonify

def success_response(data=None, message="Success"):
    return jsonify({
        "success": True,
        "message": message,
        "data": data
    })

def error_response(message="Error", code=400, error_code=None):
    return jsonify({
        "success": False,
        "message": message,
        "error_code": error_code
    }), code
""")
    
    # Middleware
    create_file("backend/app/middleware/__init__.py", "")
    create_file("backend/app/middleware/cors.py", "# Configuração CORS")
    create_file("backend/app/middleware/rate_limit.py", "# Rate limiting")
    create_file("backend/app/middleware/error_handler.py", "# Tratamento global de erros")
    
    # Exceptions
    create_file("backend/app/exceptions/__init__.py", "")
    create_file("backend/app/exceptions/auth_exceptions.py", """class AuthException(Exception):
    pass

class InvalidCredentialsException(AuthException):
    pass

class TokenExpiredException(AuthException):
    pass

class TokenInvalidException(AuthException):
    pass
""")
    create_file("backend/app/exceptions/database_exceptions.py", """class DatabaseException(Exception):
    pass

class ConnectionException(DatabaseException):
    pass

class QueryException(DatabaseException):
    pass
""")
    
    # Logs directory
    os.makedirs("backend/logs", exist_ok=True)
    create_file("backend/logs/.gitkeep", "")
    
    # Tests
    create_file("backend/tests/__init__.py", "")
    create_file("backend/tests/test_auth.py", "# Testes de autenticação")
    create_file("backend/tests/test_database.py", "# Testes de conexão")
    create_file("backend/tests/test_routes.py", "# Testes das rotas")
    
    # ===========================================
    # FRONTEND STRUCTURE  
    # ===========================================
    print("\n📁 FRONTEND - Criando estrutura React...")
    
    # Root files
    create_file("frontend/.env", """VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Intranet Fullstack
""")
    
    create_file("frontend/package.json", """{
  "name": "intranet-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.15.0",
    "axios": "^1.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "eslint": "^8.45.0",
    "eslint-plugin-react": "^7.32.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "vite": "^4.4.5"
  }
}
""")
    
    create_file("frontend/vite.config.js", """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
""")
    
    create_file("frontend/index.html", """<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Intranet Fullstack</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
""")
    
    # Src structure
    create_file("frontend/src/App.jsx", "# Componente principal")
    create_file("frontend/src/main.jsx", """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
""")
    
    # Components
    create_file("frontend/src/components/common/Header.jsx", "# Header component")
    create_file("frontend/src/components/common/Sidebar.jsx", "# Sidebar component")
    create_file("frontend/src/components/common/Loading.jsx", "# Loading component")
    create_file("frontend/src/components/common/ErrorBoundary.jsx", "# Error boundary")
    
    create_file("frontend/src/components/forms/LoginForm.jsx", "# Login form")
    create_file("frontend/src/components/forms/UserForm.jsx", "# User form")
    
    create_file("frontend/src/components/ui/Button.jsx", "# Button component")
    create_file("frontend/src/components/ui/Input.jsx", "# Input component")
    create_file("frontend/src/components/ui/Modal.jsx", "# Modal component")
    
    # Pages
    create_file("frontend/src/pages/Login.jsx", "# Página de login")
    create_file("frontend/src/pages/Dashboard.jsx", "# Dashboard principal")
    create_file("frontend/src/pages/Users.jsx", "# Gestão de usuários")
    create_file("frontend/src/pages/NotFound.jsx", "# Página 404")
    
    # Services
    create_file("frontend/src/services/api.js", "# Configuração axios")
    create_file("frontend/src/services/authService.js", "# Serviço de autenticação")
    create_file("frontend/src/services/userService.js", "# Serviço de usuários")
    
    # Contexts
    create_file("frontend/src/contexts/AuthContext.jsx", "# Contexto de autenticação")
    create_file("frontend/src/contexts/AppContext.jsx", "# Contexto global")
    
    # Hooks
    create_file("frontend/src/hooks/useAuth.js", "# Hook de autenticação")
    create_file("frontend/src/hooks/useApi.js", "# Hook para API calls")
    create_file("frontend/src/hooks/useLocalStorage.js", "# Hook localStorage")
    
    # Router
    create_file("frontend/src/router/AppRouter.jsx", "# Router principal")
    create_file("frontend/src/router/PrivateRoute.jsx", "# Rotas protegidas")
    create_file("frontend/src/router/PublicRoute.jsx", "# Rotas públicas")
    
    # Guards
    create_file("frontend/src/guards/AuthGuard.jsx", "# Guard de autenticação")
    create_file("frontend/src/guards/RoleGuard.jsx", "# Guard de permissões")
    
    # Utils
    create_file("frontend/src/utils/constants.js", """export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh'
  }
}

export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data'
}
""")
    create_file("frontend/src/utils/formatters.js", "# Formatadores")
    create_file("frontend/src/utils/validators.js", "# Validadores")
    create_file("frontend/src/utils/storage.js", """export const storage = {
  get: (key) => {
    try {
      return JSON.parse(localStorage.getItem(key))
    } catch {
      return null
    }
  },
  
  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value))
  },
  
  remove: (key) => {
    localStorage.removeItem(key)
  },
  
  clear: () => {
    localStorage.clear()
  }
}
""")
    
    # Styles
    create_file("frontend/src/styles/globals.css", """* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
""")
    create_file("frontend/src/styles/components/.gitkeep", "")
    create_file("frontend/src/styles/pages/.gitkeep", "")
    
    # Assets
    create_file("frontend/src/assets/images/.gitkeep", "")
    create_file("frontend/src/assets/icons/.gitkeep", "")
    create_file("frontend/src/assets/fonts/.gitkeep", "")
    
    # Public
    create_file("frontend/public/favicon.ico", "")
    create_file("frontend/public/manifest.json", """{
  "short_name": "Intranet",
  "name": "Intranet Fullstack",
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
""")
    
    # ===========================================
    # ROOT FILES
    # ===========================================
    print("\n📁 ROOT - Criando arquivos raiz...")
    
    create_file(".gitignore", """# Dependencies
backend/__pycache__/
backend/*.pyc
backend/.env
frontend/node_modules/
frontend/dist/

# Logs
backend/logs/*.log

# IDEs
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
""")
    
    create_file("README.md", """# 🏢 Intranet Fullstack

Sistema interno desenvolvido com Flask (backend) e React (frontend).

## 🚀 Como executar

### Backend
```bash
cd backend
pip install -r requirements.txt
python run.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📁 Estrutura
- `/backend` - API Flask com autenticação Oracle
- `/frontend` - Interface React com Vite

## 🔧 Configuração
1. Configure as variáveis no `backend/.env`
2. Configure as variáveis no `frontend/.env`
3. Execute o backend na porta 5000
4. Execute o frontend na porta 3000
""")
    
    print("\n✅ Estrutura criada com sucesso!")
    print("\n🔧 Próximos passos:")
    print("1. Configurar variáveis de ambiente (.env)")
    print("2. Instalar dependências (pip install -r requirements.txt)")
    print("3. Continuar desenvolvimento dos próximos módulos")

if __name__ == "__main__":
    create_structure()