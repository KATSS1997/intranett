# backend/app/utils/responses.py
# --- ARQUIVO CORRIGIDO ---

from flask import jsonify

def success(data=None, message="Success", status_code=200):
    """
    Cria uma resposta JSON padronizada para sucesso.
    """
    response = {
        "status": "success",
        "message": message,
        "data": data
    }
    return jsonify(response), status_code

def error(message="Error", status_code=400):
    """
    Cria uma resposta JSON padronizada para erro.
    """
    response = {
        "status": "error",
        "message": message
    }
    return jsonify(response), status_code

