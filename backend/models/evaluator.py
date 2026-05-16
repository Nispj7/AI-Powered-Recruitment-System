import re

def _basic_coherence_score(text: str) -> float:
    words = re.findall(r"[a-zA-Z']+", text)
    if not words:
        return 0.0
    # small heuristic: more structure words => better
    structure = sum(1 for w in words if w.lower() in {"because","therefore","however","so","first","second","finally"})
    length = min(len(words)/80.0, 1.0)
    return min(10.0, 3.5 + 3.0*length + 0.5*structure)

def grade_answer(phase: str, q_num: int, text: str):
    """
    Prototype grading:
      - Theory (Q4-Q8): coherence + keyword presence
      - Coding (Q9-Q11): coherence + mentions of approach/complexity
    Returns 0..10.
    """
    base = _basic_coherence_score(text)

    if phase == "B":
        # reward some technical markers
        markers = {"overfitting","regularization","precision","recall","attention","embeddings","imbalance","f1","auc"}
        hit = sum(1 for m in markers if m in text.lower())
        score = min(10.0, base + 0.3*hit)
        kind = "theory"
    elif phase == "C":
        markers = {"time","space","complexity","o(", "kadane", "hash", "sort", "heap", "top", "k"}
        hit = sum(1 for m in markers if m in text.lower())
        score = min(10.0, base + 0.4*hit)
        kind = "coding"
    else:
        score = min(10.0, base)
        kind = "warmup/reflection"

    return {"kind": kind, "score": round(score, 2), "strengths": _strengths(text), "limitations": _limits(text)}

def _strengths(text: str):
    t = text.lower()
    s = []
    if "because" in t or "therefore" in t:
        s.append("Reasoning is structured.")
    if len(t.split()) > 60:
        s.append("Provides detailed explanation.")
    if any(x in t for x in ["example","for instance"]):
        s.append("Uses examples to clarify ideas.")
    return s[:3] if s else ["Answer is understandable."]

def _limits(text: str):
    t = text.lower()
    l = []
    if len(t.split()) < 20:
        l.append("Could provide more detail.")
    if "i don't know" in t or "not sure" in t:
        l.append("Shows uncertainty; clarify key points.")
    return l[:3] if l else ["No major issues detected."]
