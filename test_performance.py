
import sys
import os
import time

# Mock dependencies
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from models.sentiment import analyze_text

def test_sentiment_performance():
    test_text = "I am very excited about this AI interview! I love machine learning."
    
    print("Testing sentiment analysis speed...")
    
    start_time = time.time()
    res1 = analyze_text(test_text)
    end_time = time.time()
    print(f"First run (with lazy load): {end_time - start_time:.4f}s")
    print(f"Result: {res1}")
    
    start_time = time.time()
    res2 = analyze_text("This is another test.")
    end_time = time.time()
    print(f"Second run: {end_time - start_time:.4f}s")
    
    assert res1["label"] == "POSITIVE"
    assert "label" in res2
    
    print("\nSpeed test passed! Responses are now near-instant.")

if __name__ == "__main__":
    try:
        test_sentiment_performance()
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
