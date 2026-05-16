import requests

def test_feedback():
    url = "http://127.0.0.1:5000/api/interview/feedback"
    data = {
        "session_id": 1, # Assumes session 1 exists
        "rating": 5,
        "comments": "Great AI interview experience!"
    }
    try:
        resp = requests.post(url, json=data)
        print(f"Response: {resp.status_code}")
        print(f"Content: {resp.json()}")
        if resp.status_code == 200 and resp.json().get("ok"):
            print("Feedback endpoint test passed!")
        else:
            print("Feedback endpoint test failed (check session_id exists)")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_feedback()
