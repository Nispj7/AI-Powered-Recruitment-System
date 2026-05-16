import requests
import json

# Test submit_answer endpoint
url = "http://127.0.0.1:5000/api/interview/submit_answer"

# First, let's start a session
start_url = "http://127.0.0.1:5000/api/interview/start_session"
start_data = {"user_id": 1, "domain": "Frontend"}

print("Starting session...")
try:
    response = requests.post(start_url, json=start_data)
    print(f"Status: {response.status_code}")
    print(f"Raw Response Text: {response.text}")
    
    if response.status_code == 200:
        session_data = response.json()
        session_id = session_data.get("session_id")
        
        print(f"\nSubmitting answer for session {session_id}...")
        answer_data = {
            "session_id": session_id,
            "answer_text": "I have experience with React and Vue.js",
            "answer_mode": "text"
        }
        
        answer_response = requests.post(url, json=answer_data)
        print(f"Status: {answer_response.status_code}")
        print(f"Response: {answer_response.text}")
    else:
        print("\nFailed to start session. Check backend logs for error details.")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
