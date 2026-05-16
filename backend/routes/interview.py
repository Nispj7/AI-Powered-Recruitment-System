import os
from datetime import datetime
from flask import Blueprint, request, jsonify
from db import execute, query_one, query_all
from config import TOTAL_QUESTIONS
print(f"!!! BACKEND LOADED: TOTAL_QUESTIONS={TOTAL_QUESTIONS} !!!", flush=True)
from models.sentiment import analyze_text
from models.keyword_extraction import extract_keywords
from models.audio_stress import stress_from_audio
from logic.buckets import bucket_hits
from logic.decision import decide
from logic.report import generate_report
from llm.openai_client import client
from llm.prompts import SYSTEM_INTERVIEWER, SYSTEM_GRADER, build_question_prompt, build_grading_prompt
from models.interview_manager import BASE_QUESTIONS, PHASES

interview_bp = Blueprint("interview", __name__)
import sys
def log(msg):
    print(msg, flush=True)
    sys.stdout.flush()

log(f"!!! LOADING INTERVIEW ROUTES FROM: {os.path.abspath(__file__)} !!!")

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def _phase_for_q(q_no: int) -> str:
    for code, info in PHASES.items():
        low, high = info["range"]
        if low <= q_no <= high:
            return info["purpose"]
    return "closing"

def _levels(conf: float, stress: float):
    conf_level = "HIGH" if conf >= 0.80 else ("MEDIUM" if conf >= 0.60 else "LOW")
    stress_level = "LOW" if stress <= 0.40 else ("MEDIUM" if stress <= 0.75 else "HIGH")
    return conf_level, stress_level

def _fallback_question(phase: str, topics, q_no: int):
    # Used only if OpenAI key not set or on LLM error
    domain_list = topics if isinstance(topics, list) else [topics or "GENERAL"]
    domain = domain_list[0].upper()
    is_ai_ml = any(x in domain for x in ["AI", "ML", "DATA", "DS", "INTEL", "LEARN"])

    q = BASE_QUESTIONS.get(q_no)
    if q:
        # If it's AI/ML related domain, or if the question is generic/coding, use it
        if is_ai_ml or q_no in [1, 2, 3, 9, 10, 11, 12]:
             # Simple string replacement for basic adaptation
             adapted_q = q.replace("AI/ML", domain.capitalize())
             return adapted_q, f"Step {q_no} technical question ({phase})"
        
        # For theory/reflect questions that are too AI-specific, provide a generic alternative
        if q_no == 4: return f"What are the most common challenges you face when developing {domain} systems?", "Theory fallback"
        if q_no == 5: return f"How do you ensure the quality and reliability of your {domain} projects?", "Theory fallback"
        return q, f"Step {q_no} technical question ({phase})"
    
    return ("Do you have any final questions or thoughts before we wrap up?",
            "Closing question.")

def _gpt_next_question(summary: dict):
    c = client()
    if not c:
        q, r = _fallback_question(summary["phase"], summary["topics"], summary["q_no"])
        return q, r

    target_q = BASE_QUESTIONS.get(summary["q_no"])
    prompt = build_question_prompt(summary)
    if target_q:
        domain = ",".join(summary["topics"])
        prompt += f"\nNote: The candidate is being interviewed for {domain}. Use the following question as a TEMPLATE: '{target_q}'. If the template is specific to AI/ML but the candidate is in a different field, ADAPT the question to be relevant to {domain} while keeping the same difficulty and intent (e.g., if it's a theory question about overfitting, ask a relevant theory question for {domain})."

    try:
        resp = c.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_INTERVIEWER},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6
        )
        if not resp:
            raise Exception("LLM returned empty response")
        text = resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"LLM Error (Next Q): {e}")
        q, r = _fallback_question(summary["phase"], summary["topics"], summary["q_no"])
        return q, r

    # Parse strict format
    q_line = [l for l in text.splitlines() if l.startswith("QUESTION:")]
    r_line = [l for l in text.splitlines() if l.startswith("REASON:")]
    question = q_line[0].replace("QUESTION:", "").strip() if q_line else text
    reason = r_line[0].replace("REASON:", "").strip() if r_line else "Reason not provided."
    return question, reason

def _gpt_grade(question: str, answer: str):
    c = client()
    
    # Check for evasion FIRST, even before calling GPT
    from logic.buckets import bucket_hits
    _, neg = bucket_hits(answer)
    is_evasive = bool(neg) or len(answer.split()) < 4

    # Evasion check: FORCE 0.0 for any answer < 10 words containing neg hits
    if is_evasive:
        print(f"!!! EVASION DETECTED: Forcing 0.0 for answer: '{answer}' !!!", flush=True)
        return 0.0, "Zero technical depth", "Evasive or extremely brief answer"

    if not c:
        return 2.0, "Minimal attempt", "Heuristic score (No API key)"

    prompt = build_grading_prompt(question, answer)
    try:
        resp = c.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_GRADER},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0
        )
        if not resp:
            raise Exception("LLM returned empty response")
        out = resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"LLM Error (Grading): {e}")
        if is_evasive:
            return 0.0, "Evasive check failed", "Critical lack of knowledge"
        return 2.0, "Score unavailable", "System error fallback"

    # Parse
    score = 0
    strengths = ""
    limits = ""
    for line in out.splitlines():
        if line.startswith("SCORE:"):
            try:
                score = int(line.replace("SCORE:", "").strip())
            except:
                score = 0
        elif line.startswith("STRENGTHS:"):
            strengths = line.replace("STRENGTHS:", "").strip()
        elif line.startswith("LIMITATIONS:"):
            limits = line.replace("LIMITATIONS:", "").strip()

    feedback = f"Strengths: {strengths}\nLimitations: {limits}".strip()
    print(f"!!! GPT EVALUATION: Score={score}/10 | Strengths='{strengths}' | Limitations='{limits}' !!!", flush=True)
    return score, strengths, limits if limits else feedback

@interview_bp.post("/start_session")
def start_session():
    try:
        data = request.get_json(force=True)
        user_id = int(data["user_id"])
        ts_now = datetime.now().isoformat(timespec="seconds")

        session_id = execute(
            "INSERT INTO sessions(user_id, started_at, status, current_q, phase) VALUES(%s,%s,%s,%s,%s)",
            (user_id, ts_now, "ACTIVE", 0, "warmup")
        )

        domain = (data.get("domain") or "GENERAL").upper()
        
        # First question
        print(f"!!! STARTING SESSION: Forced Limit is {TOTAL_QUESTIONS} !!!", flush=True)
        summary = {
            "phase": "warmup",
            "q_no": 1,
            "total_q": TOTAL_QUESTIONS,
            "topics": [domain],
            "sentiment": "NEUTRAL",
            "conf_level": "LOW",
            "stress_level": "LOW",
            "asked_topics": []
        }
        q, reason = _gpt_next_question(summary)

        execute("""
          INSERT INTO turns(session_id,q_no,question,created_at,reasoning,keywords,phase)
          VALUES(%s,%s,%s,%s,%s,%s,%s)
        """, (session_id, 1, q, ts_now, reason, domain, "warmup"))

        execute("UPDATE sessions SET current_q=%s, phase=%s WHERE id=%s", (1, "warmup", session_id))

        return jsonify({"ok": True, "session_id": session_id, "question": q, "reason": reason, "q_no": 1})
    except Exception as e:
        print(f"Error in start_session: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500

@interview_bp.post("/submit_answer")
def submit_answer():
    """
    Accepts:
    - session_id
    - answer_text (for text mode)
    - answer_mode: text|audio
    - if audio: frontend sends base64 wav (simple) OR file upload in separate endpoint
    """
    try:
        data = request.get_json(force=True)
        session_id = int(data["session_id"])
        answer_text = (data.get("answer_text") or "").strip()
        answer_mode = (data.get("answer_mode") or "text").strip()

        session = query_one("SELECT * FROM sessions WHERE id=%s", (session_id,))
        if not session or session["status"] != "ACTIVE":
            return jsonify({"ok": False, "error": "Session not active"}), 400

        q_no = int(session["current_q"])
        log(f"!!! SUBMIT ANSWER: Session {session_id}, Turn {q_no} !!!")
        
        # NUCLEAR KILL-SWITCH: No question beyond limit allowed!
        if q_no > TOTAL_QUESTIONS:
            log(f"!!! NUCLEAR KILL-SWITCH: Blocking Turn {q_no} for Session {session_id} !!!")
            return jsonify({"ok": False, "error": f"Interview limit reached ({TOTAL_QUESTIONS} questions)."}), 403

        turn = query_one("SELECT * FROM turns WHERE session_id=%s AND q_no=%s", (session_id, q_no))

        # ML text
        sent = analyze_text(answer_text)
        sentiment_label = sent["label"]
        text_conf = float(sent["confidence"])

        # Buckets + keywords
        pos, neg = bucket_hits(answer_text)
        new_keywords = extract_keywords(answer_text)
        
        # STICKY TOPICS: If answer has no keywords, keep the question's topic
        if new_keywords == ["GENERAL"] and turn["keywords"] and turn["keywords"] != "GENERAL":
            final_keywords = turn["keywords"].split(",")
        else:
            final_keywords = new_keywords

        # Calculate Stress (Indicators of anxiety or evasion)
        stress = 0.0
        wav_path = data.get("wav_path", "")
        if answer_mode == "audio" and wav_path:
            from models.audio_stress import analyze_audio
            try:
                stress = analyze_audio(wav_path)
            except:
                stress = 0.0
        elif answer_mode == "text":
            # For text, we use brevity and evasion as stress indicators
            word_count = len(answer_text.split())
            if neg: # if negative bucket hits detected in this turn
                stress = 0.8  # Very high stress for evasive answers
            elif word_count < 6:
                stress = 0.5  # Significant stress for extremely brief answers
            elif word_count < 15:
                stress = 0.2  # Slight stress for short answers

        # Save analysis into current turn
        ts_now = datetime.now().isoformat(timespec="seconds")
        execute("""
          UPDATE turns
          SET answer_text=%s, answer_mode=%s, sentiment_label=%s, text_confidence=%s, stress_score=%s,
              keywords=%s, pos_hits=%s, neg_hits=%s
          WHERE id=%s
        """, (
            answer_text, answer_mode, sentiment_label, text_conf, stress,
            ",".join(final_keywords), "||".join(pos), "||".join(neg), turn["id"]
        ))

        return submit_answer_logic(session_id)
    except Exception as e:
        print(f"Error in submit_answer: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500

@interview_bp.get("/debug_env")
def debug_env():
    import logic.decision, logic.report, config
    return jsonify({
        "interview_path": os.path.abspath(__file__),
        "decision_path": os.path.abspath(logic.decision.__file__),
        "report_path": os.path.abspath(logic.report.__file__),
        "config_path": os.path.abspath(config.__file__),
        "TOTAL_QUESTIONS": TOTAL_QUESTIONS,
        "ENV": dict(os.environ)
    })

def submit_answer_logic(session_id):
    ts_now = datetime.now().isoformat(timespec="seconds")
    log(f"!!! submit_answer_logic CALLED for session {session_id} !!!")
    try:
        session = query_one("SELECT * FROM sessions WHERE id=%s", (session_id,))
        if not session:
            return jsonify({"ok": False, "error": "Session not found"}), 404
            
        q_no = int(session["current_q"])
        print(f"!!! SESSION AUDIT ({session_id}): q_no={q_no}, limit={TOTAL_QUESTIONS}, status={session['status']} !!!", flush=True)
        print(f"!!! DEBUG CHECK: q_no ({q_no}) >= TOTAL_QUESTIONS ({TOTAL_QUESTIONS})? -> {q_no >= TOTAL_QUESTIONS}", flush=True)

        # EARLY EXIT FAILSAFE (Double-Check)
        if q_no >= TOTAL_QUESTIONS:
             print(f"!!! SYSTEM: Forced Early Departure at Turn {q_no} !!!", flush=True)
             turns = query_all("SELECT * FROM turns WHERE session_id=%s ORDER BY q_no ASC", (session_id,))
             decision, final_score, criteria = decide(turns)
             execute("UPDATE sessions SET status=%s, ended_at=%s, final_decision=%s, final_score=%s WHERE id=%s",
                     ("COMPLETED", ts_now, decision, final_score, session_id))
             user = query_one("SELECT full_name FROM users WHERE id=%s", (session["user_id"],))
             report_md = generate_report(user.get("full_name", "Candidate"), session_id, turns, decision, final_score, criteria)
             return jsonify({"ok": True, "done": True, "decision": decision, "final_score": final_score, "report": report_md})

        # Re-fetch the current turn properly
        turn = query_one("SELECT * FROM turns WHERE session_id=%s AND q_no=%s", (session_id, q_no))
        if not turn:
            print(f"!!! CRITICAL: Turn not found for session {session_id}, q_no {q_no} !!!", flush=True)
            return jsonify({"ok": False, "error": "Turn not found"}), 500
        
        # Grade ALL phases for technical attempt to avoid loopholes
        phase = _phase_for_q(q_no)
        print(f"DEBUG: Processing Turn {q_no}, Phase: {phase}, Total Limit: {TOTAL_QUESTIONS}", flush=True)

        if phase in ["warmup", "theory", "coding"]:
            answer_text = (turn.get("answer_text") or "").strip()
            neg_hits = (turn.get("neg_hits") or "").strip()
            
            # ABSOLUTE DENIAL: If answer is < 10 words and evasive, force 0.0
            if not answer_text or neg_hits or len(answer_text.split()) < 5:
                print(f"!!! SYSTEM: Forced Zero Technical Grade for turn {q_no} !!!", flush=True)
                score, strengths, limitations = 0.0, "No technical attempt", "Evasive/Short answer"
                # Also force confidence to 0 for this turn in DB
                execute("UPDATE turns SET text_confidence=0.0 WHERE id=%s", (turn["id"],))
            else:
                score, strengths, limitations = _gpt_grade(turn["question"], answer_text)
                
            execute("UPDATE turns SET gpt_grade=%s, gpt_grade_feedback=%s WHERE id=%s",
                    (score, f"{strengths} | {limitations}", turn["id"]))

        # If finished all questions -> end + decide + report
        ts_now = datetime.now().isoformat(timespec="seconds")
        # HARD FAILSAFE: Force Done at Turn TOTAL_QUESTIONS
        if q_no >= TOTAL_QUESTIONS:
            log(f"!!! SYSTEM: Hard Failsafe Triggered at Turn {q_no} !!!")
            turns = query_all("SELECT * FROM turns WHERE session_id=%s ORDER BY q_no ASC", (session_id,))
            
            # Turn Debug
            for t in turns:
                log(f"DEBUG TURN {t['q_no']}: grade={t['gpt_grade']}, conf={t['text_confidence']}, stress={t['stress_score']}, neg={t['neg_hits']}")
                
            decision, final_score, criteria = decide(turns)
            log(f"!!! FINAL SYSTEM DECISION: {decision}, Score: {final_score} !!!")

            execute("UPDATE sessions SET status=%s, ended_at=%s, final_decision=%s, final_score=%s WHERE id=%s",
                    ("COMPLETED", ts_now, decision, final_score, session_id))

            user = query_one("SELECT full_name FROM users WHERE id=%s", (session["user_id"],))
            report_md = generate_report(user["full_name"], session_id, turns, decision, final_score, criteria)

            return jsonify({"ok": True, "done": True, "decision": decision, "final_score": final_score, "report": report_md})

        # Else generate next question
        next_q = q_no + 1
        next_phase = _phase_for_q(next_q)

        # Build summary from last few turns
        past = query_all("SELECT keywords, text_confidence, stress_score, sentiment_label FROM turns WHERE session_id=%s ORDER BY q_no ASC",
                         (session_id,))
        asked_topics = []
        for p in past:
            if p["keywords"]:
                asked_topics.extend(p["keywords"].split(","))

        # Use current turn metrics for next question generation
        text_conf = turn.get("text_confidence") or 0.5
        stress = turn.get("stress_score") or 0.0
        sentiment_label = turn.get("sentiment_label") or "NEUTRAL"
        final_keywords = turn["keywords"].split(",") if turn["keywords"] else ["GENERAL"]

        conf_level, stress_level = _levels(text_conf, stress)
        summary = {
            "phase": next_phase,
            "q_no": next_q,
            "total_q": TOTAL_QUESTIONS,
            "topics": final_keywords,
            "sentiment": sentiment_label,
            "conf_level": conf_level,
            "stress_level": stress_level,
            "asked_topics": asked_topics[-12:]
        }

        q, reason = _gpt_next_question(summary)

        execute("""
          INSERT INTO turns(session_id,q_no,question,created_at,reasoning,keywords,phase)
          VALUES(%s,%s,%s,%s,%s,%s,%s)
        """, (session_id, next_q, q, ts_now, reason, ",".join(final_keywords), next_phase))

        execute("UPDATE sessions SET current_q=%s, phase=%s WHERE id=%s", (next_q, next_phase, session_id))

        return jsonify({"ok": True, "done": False, "question": q, "reason": reason, "q_no": next_q, "phase": next_phase})
    except Exception as e:
        print(f"Error in submit_answer_logic: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500

@interview_bp.get("/report/<int:session_id>")
def get_report(session_id: int):
    rep = query_one("SELECT performance_json FROM reports WHERE session_id=%s", (session_id,))
    if not rep:
        return jsonify({"ok": False, "error": "Report not found"}), 404
    
    # performance_json is already a dict if using MySQL JSON type or manually parsed
    performance = rep["performance_json"]
    if isinstance(performance, str):
        import json
        performance = json.loads(performance)
        
    return jsonify({"ok": True, "report": performance.get("report", "")})

@interview_bp.post("/upload_audio")
def upload_audio():
    from flask import request
    from models.audio_stress import stress_from_audio
    from models.sentiment import analyze_text
    from models.keyword_extraction import extract_keywords
    from logic.buckets import bucket_hits
    from datetime import datetime
    import uuid
    import os

    session_id = int(request.form["session_id"])
    file = request.files["audio"]

    filename = f"{uuid.uuid4().hex}.wav"
    wav_path = os.path.join(UPLOAD_DIR, filename)
    file.save(wav_path)

    # Compute stress
    stress = stress_from_audio(wav_path)

    session = query_one("SELECT * FROM sessions WHERE id=%s", (session_id,))
    q_no = session["current_q"]

    turn = query_one(
        "SELECT * FROM turns WHERE session_id=%s AND q_no=%s",
        (session_id, q_no)
    )

    # No text → neutral text sentiment
    sentiment = "NEUTRAL"
    text_conf = 0.5

    # Save audio stress
    execute("""
      UPDATE turns
      SET answer_mode=%s, stress_score=%s
      WHERE id=%s
    """, ("audio", stress, turn["id"]))

    # Move to next question (same logic as text)
    return submit_answer_internal(session_id, "", "audio", wav_path)
@interview_bp.post("/feedback")
def submit_feedback():
    try:
        data = request.get_json(force=True)
        session_id = int(data["session_id"])
        rating = int(data["rating"])
        comments = (data.get("comments") or "").strip()

        execute(
            "INSERT INTO feedback (session_id, rating, comments) VALUES (%s, %s, %s)",
            (session_id, rating, comments)
        )

        return jsonify({"ok": True, "message": "Feedback submitted successfully"})
    except Exception as e:
        print(f"Error in submit_feedback: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500

def submit_answer_internal(session_id, answer_text, answer_mode, wav_path):
    session = query_one("SELECT * FROM sessions WHERE id=%s", (session_id,))
    q_no = session["current_q"]

    stress = stress_from_audio(wav_path) if wav_path else 0.0

    ts_now = datetime.now().isoformat(timespec="seconds")

    execute("""
      UPDATE turns
      SET answer_text=%s, answer_mode=%s, stress_score=%s
      WHERE session_id=%s AND q_no=%s
    """, (answer_text, answer_mode, stress, session_id, q_no))

    # Same next-question logic reused
    return submit_answer_logic(session_id)


