import requests
import json

BASE_URL = "http://127.0.0.1:5000/api/reports"

def test_reports():
    # 1. Save a report
    payload = {
        "name": "Test Candidate",
        "total_grade": 7.5,
        "result": "HIRE",
        "performance": {"test": "data"}
    }
    resp = requests.post(BASE_URL + "/", json=payload)
    print("POST Response:", resp.json())

    # 2. Get all reports
    resp = requests.get(BASE_URL + "/")
    print("GET Response:", resp.json())

if __name__ == "__main__":
    test_reports()
