import requests
import json

# First start a session to get a valid session_id
start_url = "http://127.0.0.1:5000/api/interview/start_session"
start_data = {"user_id": 6, "domain": "frontend"}

print("Starting session...")
res = requests.post(start_url, json=start_data)
if res.status_code != 200:
    print(f"Failed to start session: {res.text}")
    exit(1)

session_id = res.json()["session_id"]
print(f"Session started: {session_id}")

# Now submit an answer
submit_url = "http://127.0.0.1:5000/api/interview/submit_answer"
submit_data = {
    "session_id": session_id,
    "answer_text": "I am a senior frontend developer with 5 years of experience in React.",
    "answer_mode": "text"
}

print("\nSubmitting answer...")
try:
    res = requests.post(submit_url, json=submit_data)
    print(f"Status Code: {res.status_code}")
    print(f"Response Body: {json.dumps(res.json(), indent=2)}")
except Exception as e:
    print(f"Error submitting answer: {e}")
    import traceback
    traceback.print_exc()
