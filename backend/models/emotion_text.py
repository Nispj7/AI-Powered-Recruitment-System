import re

POS = {"good","great","excellent","confident","sure","happy","love","strong","clear",
    "positive","motivated","capable","prepared","ready","focused","calm","excited",
    "optimistic","determined","resilient","improving","growth","learning","skilled",
    "experienced","supportive","achieved","successful","grateful","comfortable",
    "trust","stable","progress","passionate","enthusiastic","productive",
    "collaborative","adaptable","responsible","disciplined","committed","creative",
    "solution","efficient","competent","secure","hopeful","inspired","balanced"}
NEG = {"bad","confused","worried","stress","anxious","dont","can't","fail","weak","nervous",
    "afraid","fear","uncertain","doubt","overwhelmed","pressure","panic",
    "tired","frustrated","angry","upset","sad","disappointed","insecure",
    "mistake","error","problem","difficult","hard","struggle","risk",
    "unstable","lost","stuck","conflict","blame","rejected","ignored",
    "helpless","hopeless","burnout","fatigue","criticized","unprepared",
    "hesitant","demotivated","discouraged","negative","toxic","threat"}
NEU = {"okay","fine","average","normal","manageable","alright",
    "standard","regular","typical","moderate"}

def analyze_text_emotion(text: str):
    """
    Returns:
      sentiment: pos/neutral/neg
      confidence: 0..1 (heuristic)
    """
    t = text.lower()
    words = re.findall(r"[a-z']+", t)

    pos = sum(1 for w in words if w in POS)
    neg = sum(1 for w in words if w in NEG)

    if pos > neg:
        sentiment = "pos"
    elif neg > pos:
        sentiment = "neg"
    else:
        sentiment = "neutral"

    # heuristic confidence: longer coherent text => higher
    length_score = min(len(words) / 60.0, 1.0)
    hedges = sum(1 for w in words if w in {"maybe","probably","i think","i guess"})
    hedge_penalty = min(hedges * 0.08, 0.3)
    confidence = max(0.05, min(1.0, length_score - hedge_penalty + (0.15 if sentiment=="pos" else 0)))

    return {"sentiment": sentiment, "confidence": round(confidence, 3)}
