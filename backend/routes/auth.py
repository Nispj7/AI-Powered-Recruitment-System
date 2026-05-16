from flask import Blueprint, request, jsonify
from db import query_one, execute

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/login")
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Missing request body"}), 400
        
        email = data.get("email")
        password = data.get("password")

        user = query_one("SELECT * FROM users WHERE email=%s AND password=%s", (email, password))
        if not user:
            return jsonify({"success": False, "message": "Invalid credentials"}), 401

        return jsonify({
            "success": True, 
            "user_id": user["id"], 
            "email": user["email"], 
            "username": user["full_name"],
            "role": user["role"]
        })
    except Exception as e:
        print(f"Login Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
