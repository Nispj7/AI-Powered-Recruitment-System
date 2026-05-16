# -*- coding: utf-8 -*-
import sys

# Force UTF-8 encoding for Windows to prevent Unicode crashes
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from flask import Flask
from flask_cors import CORS

from routes.auth import auth_bp
from routes.interview import interview_bp
from routes.reports import reports_bp

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

print("-" * 50, flush=True)
print("AI Interview Backend [VERSION 2.3-ULTIMATE]", flush=True)
import sys, os
from config import TOTAL_QUESTIONS
print(f"!!! EMERGENCY AUDIT !!!", flush=True)
print(f"File Path: {os.path.abspath(__file__)}", flush=True)
print(f"Question Limit: {TOTAL_QUESTIONS}", flush=True)
print(f"Python: {sys.executable}", flush=True)
print("-" * 50, flush=True)

# Register routes
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(interview_bp, url_prefix="/api/interview")
app.register_blueprint(reports_bp, url_prefix="/api/reports")

@app.get("/")
def home():
    return {"status": "AI Interview Backend Running"}

@app.errorhandler(Exception)
def handle_error(e):
    import traceback
    print("=" * 80)
    print("UNHANDLED EXCEPTION:")
    print(traceback.format_exc())
    print("=" * 80)
    return {"error": str(e)}, 500

if __name__ == "__main__":
    app.run(debug=True, port=5000, use_reloader=False, threaded=True)
