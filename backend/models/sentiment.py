_analyzer = None

def get_analyzer():
    global _analyzer
    if _analyzer is None:
        # Extremely fast rule-based sentiment analysis
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        _analyzer = SentimentIntensityAnalyzer()
    return _analyzer

def analyze_text(text: str) -> dict:
    text = text.lower().strip()
    if not text:
        return {"label": "NEUTRAL", "confidence": 0.0}

    # Detect evasion keywords for confidence penalty
    evasion_keywords = [
        "dont know", "don't know", "no idea", "unsure", "skip", "pass",
        "i do not know", "i dont know", "no experience", "not aware"
    ]
    is_evasive = any(w in text for w in evasion_keywords)
    word_count = len(text.split())

    analyzer = get_analyzer()
    vs = analyzer.polarity_scores(text)
    
    compound = vs['compound']
    
    # Calculate base confidence
    if compound >= 0.05:
        res = {"label": "POSITIVE", "confidence": abs(compound)}
    elif compound <= -0.05:
        res = {"label": "NEGATIVE", "confidence": abs(compound)}
    else:
        res = {"label": "NEUTRAL", "confidence": 1.0 - abs(compound)}
        
    # Apply evasion penalty: if evasive, confidence (conviction) is low
    if is_evasive:
        res["confidence"] = min(res["confidence"], 0.1)
    
    # Apply brevity penalty: very short answers shouldn't have high conviction
    if word_count < 4:
        res["confidence"] = min(res["confidence"], 0.3)
        
    return res
