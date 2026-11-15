from app import create_app
from flask_cors import CORS  # ← ADICIONE

app = create_app()
CORS(app)  # ← ADICIONE ESTA LINHA

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)