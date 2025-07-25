from flask import Flask
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
