TOPICS = {
    "NLP": ["nlp", "language model", "bert", "transformer", "token", "tokenization", "llm"],
    "AI":  ["ai", "artificial intelligence", "reasoning", "agent"],
    "ML":  ["ml", "machine learning", "classification", "regression", "training", "dataset"],
    "PYTHON": ["python", "pandas", "numpy", "flask"],
    "CV": ["computer vision", "opencv", "image", "video"],
    "FRONTEND": ["frontend", "react", "vue", "angular", "html", "css", "javascript", "js", "ui", "ux", "responsive"],
    "BACKEND": ["backend", "node", "express", "django", "api", "rest", "server", "authentication", "auth"],
    "DATABASE": ["sql", "mysql", "postgres", "mongodb", "database", "query", "index", "acid"]
}

def extract_keywords(text: str):
    t = text.lower()
    hits = []
    for topic, words in TOPICS.items():
        for w in words:
            if w in t:
                hits.append(topic)
                break
    # fallback: if nothing, return GENERAL
    return sorted(list(set(hits))) if hits else ["GENERAL"]
