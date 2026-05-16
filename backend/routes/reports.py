from flask import Blueprint, request, jsonify
import json
from db import execute, query_all, query_one
from services.email_service import send_schedule_email

reports_bp = Blueprint("reports", __name__)

@reports_bp.route("/register", methods=["POST"])
def register_candidate():
    data = request.json
    try:
        full_name = data.get("full_name")
        email = data.get("email")
        password = data.get("password")
        interview_time = data.get("interview_time") # Format: "YYYY-MM-DD HH:MM:SS"

        # 1. Check if user exists
        existing = query_one("SELECT id FROM users WHERE email=%s", (email,))
        if existing:
            return jsonify({"ok": False, "error": "Email already registered"}), 400

        # 2. Create User
        user_sql = "INSERT INTO users (email, password, full_name, role) VALUES (%s, %s, %s, 'candidate')"
        execute(user_sql, (email, password, full_name))

        # 3. Initialize Report placeholder with schedule info
        # We store initial info here so admin sees scheduled interviews
        report_sql = """
            INSERT INTO reports (candidate_name, email, interview_time, result)
            VALUES (%s, %s, %s, 'SCHEDULED')
        """
        execute(report_sql, (full_name, email, interview_time))

        # 4. Send Email
        send_schedule_email(email, full_name, password, interview_time)

        return jsonify({"ok": True, "message": "Candidate registered and email sent"}), 201
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@reports_bp.route("/", methods=["POST"])
def save_report():
    data = request.json
    try:
        candidate_name = data.get("name")
        email = data.get("email")
        total_grade = data.get("total_grade")
        result = data.get("result")
        performance = data.get("performance")

        # Check if record exists for this email
        existing = query_one("SELECT id FROM reports WHERE email=%s", (email,))
        
        if existing:
            # UPDATE existing record (replaces SCHEDULED with real data)
            sql = """
                UPDATE reports 
                SET total_grade=%s, result=%s, performance_json=%s, candidate_name=%s
                WHERE email=%s
            """
            params = (total_grade, result, json.dumps(performance), candidate_name, email)
            execute(sql, params)
            msg = "Report updated successfully"
        else:
            # INSERT new record
            sql = """
                INSERT INTO reports (candidate_name, email, total_grade, result, performance_json)
                VALUES (%s, %s, %s, %s, %s)
            """
            params = (candidate_name, email or "guest@system.local", total_grade, result, json.dumps(performance))
            execute(sql, params)
            msg = "Report saved successfully"
        
        return jsonify({"ok": True, "message": msg}), 201
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@reports_bp.route("/", methods=["GET"])
def get_reports():
    try:
        sql = "SELECT id, candidate_name, email, total_grade, result, performance_json, interview_time, created_at FROM reports ORDER BY created_at DESC"
        rows = query_all(sql)
        
        # Parse JSON from DB
        for row in rows:
            if isinstance(row["performance_json"], str):
                row["performance_json"] = json.loads(row["performance_json"])
                
        return jsonify({"ok": True, "reports": rows}), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
