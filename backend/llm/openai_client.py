import os
from config import OPENAI_API_KEY

class MockClient:
    class Chat:
        class Completions:
            def create(self, **kwargs):
                return None # interview.py handles None as fallback
        completions = Completions()
    chat = Chat()

def client():
    """
    Returns a real OpenAI client if API key is set, 
    otherwise returns a Mock client for testing.
    """
    if not OPENAI_API_KEY or OPENAI_API_KEY == "your_openai_key_here":
        print("!!! OPENAI CLIENT: Using MOCK CLIENT (No Key Found) !!!", flush=True)
        return MockClient()
    
    print(f"!!! OPENAI CLIENT: Key Found (Starts with {OPENAI_API_KEY[:5]}...) -> Initializing Real Client !!!", flush=True)
    try:
        from openai import OpenAI
        return OpenAI(api_key=OPENAI_API_KEY)
    except Exception as e:
        print(f"!!! OPENAI CLIENT ERROR: Could not initialize client: {e} !!!", flush=True)
        return MockClient()
