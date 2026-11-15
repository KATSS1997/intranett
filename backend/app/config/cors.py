# backend/app/config.py
# ADICIONE ESTA CONFIGURAÇÃO CORS

from flask_cors import CORS

def configure_cors(app):
    """
    Configura CORS para permitir requisições do frontend
    """
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    print("✅ CORS configurado")
    return app