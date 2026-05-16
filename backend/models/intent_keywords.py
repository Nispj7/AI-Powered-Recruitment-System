import re

TECH_TOPICS = {
    "nlp","bert","transformer","attention","ml","ai","deep","learning","cv","vision",
    "classification","regression","overfitting","regularization","tokenization",
    "embeddings","rnn","lstm","cnn","pytorch","tensorflow","sklearn","metrics"
}

def extract_keywords_and_intent(text: str):
    t = text.lower()
    words = re.findall(r"[a-z]+", t)

    keywords = sorted(set([w for w in words if w in TECH_TOPICS]))
    # Simple intent tags
    intent = "explain" if "because" in words or "means" in words else "answer"

    return {"keywords": keywords, "intent": intent}
