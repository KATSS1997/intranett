from flask import jsonify

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
