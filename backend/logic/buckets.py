def bucket_hits(text):
    text = text.lower()
    
    # Positive Bucket (Indicators of technical depth and engagement)
    pos_keywords = [
        "experience", "implemented", "optimized", "production", "scalable",
        "architecture", "best practices", "performance", "deployment", "built",
        "solved", "critical", "design", "refactored", "monitored"
    ]
    
    # Negative Bucket (Indicators of lack of knowledge or evasion)
    neg_keywords = [
        "dont know", "don't know", "no idea", "not sure", "unsure",
        "skip", "pass", "not really", "haven't used", "havent used",
        "forgot", "limited", "never worked", "couldn't say",
        "i dont know", "i do not know", "no experience", "not aware"
    ]
    
    pos_hits = [w for w in pos_keywords if w in text]
    neg_hits = [w for w in neg_keywords if w in text]
    
    return pos_hits, neg_hits
