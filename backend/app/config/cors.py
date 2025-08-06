"""
Configuração CORS para Flask
Caminho: backend/app/config/cors.py
"""

from flask_cors import CORS
import os

def configure_cors(app):
    """
    Configura CORS para a aplicação Flask
    
    Args:
        app: Instância da aplicação Flask
    """
    
    # URLs permitidas (configurável via env)
    allowed_origins = [
        "http://localhost:3000",      # React dev
        "http://localhost:5173",      # Vite dev  
        "http://127.0.0.1:3000",      # React dev alternativo
        "http://127.0.0.1:5173"       # Vite dev alternativo
    ]
    
    # Em produção, adicionar domínios específicos
    if os.getenv('FLASK_ENV') == 'production':
        prod_origins = os.getenv('ALLOWED_ORIGINS', '').split(',')
        allowed_origins.extend([origin.strip() for origin in prod_origins if origin.strip()])
    
    # Headers permitidos
    allowed_headers = [
        'Accept',
        'Accept-Language', 
        'Content-Language',
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-CSRFToken'
    ]
    
    # Métodos permitidos
    allowed_methods = [
        'GET',
        'POST', 
        'PUT',
        'DELETE',
        'OPTIONS',
        'HEAD'
    ]
    
    # Configurar CORS
    CORS(app, 
         origins=allowed_origins,
         methods=allowed_methods,
         allow_headers=allowed_headers,
         supports_credentials=True,  # Para cookies/auth headers
         expose_headers=['Content-Range', 'X-Content-Range'],
         max_age=600  # Cache preflight por 10min
    )
    
    return app