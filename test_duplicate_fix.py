
import sys
import os

# Mock dependencies before importing interview logic
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

import config
import routes.interview as interview

def test_phase_logic():
    print(f"Testing phase logic with TOTAL_QUESTIONS={config.TOTAL_QUESTIONS}")
    for i in range(1, config.TOTAL_QUESTIONS + 1):
        phase = interview._phase_for_q(i)
        print(f"Q{i}: {phase}")
        if i == config.TOTAL_QUESTIONS:
            assert phase == "reflect", f"Last question Q{i} should be reflect phase"

def test_fallback_logic():
    print("\nTesting fallback question logic (12 questions):")
    questions = []
    for i in range(1, config.TOTAL_QUESTIONS + 1):
        phase = interview._phase_for_q(i)
        q, reason = interview._fallback_question(phase, ["AI/ML"], i)
        print(f"Q{i} ({phase}): {q}")
        questions.append(q)
        
        if i == 4:
            assert "overfitting" in q.lower(), "Question 4 should be about overfitting"
        if i == 9:
            assert "palindrome" in q.lower(), "Question 9 should be coding (palindrome)"

    # Check for duplicates
    unique_questions = set(questions)
    assert len(unique_questions) == len(questions), f"Duplicate questions found: {questions}"
    print("All fallback questions are unique and technical.")

if __name__ == "__main__":
    try:
        test_phase_logic()
        test_fallback_logic()
        print("\nAll tests passed!")
    except AssertionError as e:
        print(f"\nTest failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nAn error occurred: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
