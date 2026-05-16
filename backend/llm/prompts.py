SYSTEM_INTERVIEWER = """
You are a Senior Technical Recruiter. Conduct a structured technical interview.
Be professional, adaptive, and encouraging. Focus on depth.
"""

SYSTEM_GRADER = """
You are an expert Interview Evaluator. Grade the candidate's technical response.
Provide SCORE (1-10), STRENGTHS, and LIMITATIONS.
"""

def build_question_prompt(summary):
    total_q = summary.get('total_q', 5)
    q_no = summary['q_no']
    
    instruction = "Generate the next logical technical interview question."
    if q_no == total_q:
        instruction = "This is the FINAL question. Ask if the candidate has anything to ask or any final thoughts to wrap up the interview."
    elif q_no == total_q - 1:
        instruction = "This is the second to last question. Make it a strong technical or situational closing question."

    return f"""
    Phase: {summary['phase']}
    Question Number: {q_no} of {total_q}
    Topics: {summary['topics']}
    Sentiment: {summary['sentiment']}
    Confidence: {summary['conf_level']}
    Stress: {summary['stress_level']}
    
    {instruction}
    
    FORMAT:
    QUESTION: <your question>
    REASON: <why you asked this>
    """

def build_grading_prompt(question, answer):
    return f"""
    Question: {question}
    Candidate Answer: {answer}
    
    Evaluate this answer for technical accuracy and depth.
    FORMAT:
    SCORE: <1-10>
    STRENGTHS: <list strengths>
    LIMITATIONS: <list limitations>
    """
