
import sys
import os

# Mock dependencies
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

import config
import routes.interview as interview

def test_dynamic_fallback():
    print(f"Testing dynamic fallback with domain: WEB DEVELOPMENT")
    domain = "WEB DEVELOPMENT"
    topics = [domain]
    
    # Q2 should replace AI/ML with Web development
    q2, _ = interview._fallback_question("warmup", topics, 2)
    print(f"Q2: {q2}")
    assert "Web development" in q2, "Q2 should adapt to the domain"
    
    # Q4 should be a generic theory question for the domain, not overfitting
    q4, _ = interview._fallback_question("theory", topics, 4)
    print(f"Q4: {q4}")
    assert "challenges" in q4.lower() and domain in q4.upper(), "Q4 should be a generic theory question for the non-AI domain"
    
    # Q9 (Coding) should remain the same (palindrome)
    q9, _ = interview._fallback_question("coding", topics, 9)
    print(f"Q9: {q9}")
    assert "palindrome" in q9.lower(), "Q9 should remain as defined in BASE_QUESTIONS"

if __name__ == "__main__":
    try:
        test_dynamic_fallback()
        print("\nDynamic field tests passed!")
    except AssertionError as e:
        print(f"\nTest failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nAn error occurred: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
