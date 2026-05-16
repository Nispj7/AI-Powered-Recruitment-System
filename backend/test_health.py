import requests

# Test if backend is running
try:
    response = requests.get("http://127.0.0.1:5000/")
    print(f"Backend Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Backend is not running or crashed: {e}")
