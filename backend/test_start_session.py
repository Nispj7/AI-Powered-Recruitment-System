import requests
import json

url = "http://127.0.0.1:5000/api/interview/start_session"
data = {"user_id": 6, "domain": "data science"}

print("Testing start_session...")
print(f"URL: {url}")
print(f"Data: {json.dumps(data, indent=2)}")

try:
    response = requests.post(url, json=data)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response Text: {response.text}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\nSuccess!")
        print(f"Session ID: {result.get('session_id')}")
        print(f"Question: {result.get('question')}")
    else:
        print(f"\nError Response:")
        try:
            print(json.dumps(response.json(), indent=2))
        except:
            print(response.text)
            
except Exception as e:
    print(f"\nException: {e}")
    import traceback
    traceback.print_exc()
