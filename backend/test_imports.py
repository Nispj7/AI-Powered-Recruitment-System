# -*- coding: utf-8 -*-
import os
import sys

# Force UTF-8 encoding for Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

print("Testing imports...")

try:
    print("1. Testing db imports...")
    from db import query_one, query_all, execute
    print("   [OK] DB imports")
    
    print("2. Testing Flask imports...")
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    print("   [OK] Flask imports")
    
    print("3. Testing route imports...")
    from routes.auth import auth_bp
    print("   [OK] Auth routes")
    
    from routes.interview import interview_bp
    print("   [OK] Interview routes")
    
    from routes.reports import reports_bp
    print("   [OK] Reports routes")
    
    print("\n[SUCCESS] All imports successful!")
    print("\nNow testing database connection...")
    
    result = query_one("SELECT 1 as test")
    if result and result.get("test") == 1:
        print("[OK] Database connection")
    else:
        print("[FAIL] Database query failed")
        
except Exception as e:
    print(f"\n[ERROR] {e}")
    import traceback
    traceback.print_exc()
