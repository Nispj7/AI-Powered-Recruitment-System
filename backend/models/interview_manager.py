PHASES = {
    "A": {"range": (1, 3), "purpose": "warmup"},
    "B": {"range": (4, 8), "purpose": "theory"},
    "C": {"range": (9, 11), "purpose": "coding"},
    "D": {"range": (12, 12), "purpose": "reflect"}
}

BASE_QUESTIONS = {
    1: "Welcome! Briefly introduce yourself and one project you're proud of.",
    2: "What interests you most about AI/ML, and why?",
    3: "Describe a time you solved a difficult technical problem. What was your approach?",
    4: "Explain overfitting and how you would reduce it in a model.",
    5: "What is the difference between precision and recall? When does it matter?",
    6: "Explain attention in transformers in your own words.",
    7: "How do embeddings help in NLP tasks?",
    8: "What evaluation metrics would you use for an imbalanced classification problem?",
    9: "Coding: Write a function to check if a string is a palindrome (ignore case and non-letters).",
    10:"Coding: Given a list of integers, return the maximum subarray sum (Kadane’s algorithm). Explain complexity.",
    11:"Coding: Given a dictionary of word counts, return top-k frequent words. Explain tie handling.",
    12:"Reflect: What do you think you could improve as a candidate, and how will you work on it?"
}

def decide_phase(q_num: int) -> str:
    if 1 <= q_num <= 3: return "A"
    if 4 <= q_num <= 8: return "B"
    if 9 <= q_num <= 11: return "C"
    return "D"

def tone_from_emotion(sentiment: str, stress_bucket: str):
    # supportive but not coaching
    if sentiment == "neg" or stress_bucket in {"moderate","high"}:
        return "I’ll keep things simple and smooth. No rush—just answer whenever you’re good to go"
    return "Sounds good. Just walk me through your thoughts."

def next_question(session_memory: dict):
    q_index = session_memory["q_index"]
    next_q_num = q_index + 1
    phase = decide_phase(next_q_num)
    question = BASE_QUESTIONS.get(next_q_num, "Thanks! That wraps up our interview for today")
    return {"q_num": next_q_num, "phase": phase, "question": question}
