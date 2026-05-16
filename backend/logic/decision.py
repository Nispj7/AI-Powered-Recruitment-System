import os
print(f"!!! LOADING DECISION LOGIC FROM: {os.path.abspath(__file__)} !!!", flush=True)

def decide(turns):
    """
    Analyzes multiple turns to make a final hire/no_hire decision.
    """
    total_turns = len(turns)
    if total_turns == 0:
        return "N/A", 0.0, "No data available."

    # Detect unresponsive turns
    non_empty_turns = [t for t in turns if (t.get("answer_text") or "").strip()]
    response_rate = len(non_empty_turns) / total_turns
    
    # Detect evasion (negative bucket hits like "don't know", "skip")
    evasive_turns = [t for t in turns if (t.get("neg_hits") or "").split("||") if (t.get("neg_hits") or "")]
    evasion_rate = len(evasive_turns) / total_turns
    
    print(f"--- DECISION DEBUG: Session {turns[0]['session_id']} ---", flush=True)
    print(f"Turns: {total_turns}, Non-Empty: {len(non_empty_turns)}, Evasive: {len(evasive_turns)}", flush=True)
    print(f"Evasion Rate: {evasion_rate*100}%", flush=True)
    
    # Auto-REJECT if significantly unresponsive (less than 60% response rate)
    if response_rate < 0.6:
        return "REJECT", 0.0, f"Unresponsive (Rate: {round(response_rate*100, 1)}%)"
        
    # Auto-REJECT for excessive evasion
    if evasion_rate > 0.4:
        return "REJECT", 2.0, f"Lack of knowledge detected (Evasion Rate: {round(evasion_rate*100, 1)}%)"

    # Averages - use 0.0 as default for confidence if missing
    avg_conf = sum(t.get("text_confidence") if t.get("text_confidence") is not None else 0.0 for t in turns) / total_turns
    avg_stress = sum(t.get("stress_score") or 0.0 for t in turns) / total_turns
    
    # Technical Grade (GPT based)
    tech_grades = [t.get("gpt_grade") for t in turns if t.get("gpt_grade") is not None]
    avg_tech = sum(tech_grades) / len(tech_grades) if tech_grades else 0.0

    # Minimum technical threshold
    if avg_tech < 4.0:
        return "REJECT", round(avg_tech, 1), f"Technical below threshold ({round(avg_tech, 1)}/10)"

    # Final Score Weighting (40% Tech, 40% Confidence, 20% Composure/Stress)
    composure = 1.0 - avg_stress
    
    # Apply penalty for any evasion hits
    evasion_penalty = (evasion_rate * 5.0)
    
    final_score = (avg_tech * 0.4) + (avg_conf * 10 * 0.4) + (composure * 10 * 0.2) - evasion_penalty
    
    print("\n" + "="*50, flush=True)
    print("       FINAL GRADING RUBRIC       ", flush=True)
    print("="*50, flush=True)
    print(f"Technical Score (40%): {round(avg_tech, 2)} -> {round(avg_tech * 0.4, 2)} pts", flush=True)
    print(f"Confidence      (40%): {round(avg_conf * 10, 2)} -> {round(avg_conf * 10 * 0.4, 2)} pts", flush=True)
    print(f"Composure       (20%): {round(composure * 10, 2)} -> {round(composure * 10 * 0.2, 2)} pts", flush=True)
    print(f"Evasion Penalty      : -{round(evasion_penalty, 2)} pts", flush=True)
    print("-" * 50, flush=True)
    print(f"FINAL CALCULATED SCORE: {round(final_score, 2)} / 10.0", flush=True)
    
    final_score = round(min(10.0, max(0.0, final_score)), 1)
    decision = "HIRE" if final_score >= 7.0 else "REJECT"
    print(f"DECISION              : {decision}", flush=True)
    print("="*50 + "\n", flush=True)
    
    criteria = f"Tech: {round(avg_tech, 1)}, Conf: {round(avg_conf*10, 1)}, Evasion: {round(evasion_rate*100, 1)}%"
    
    # Extra safety: If technician didn't answer enough technically, reject even if confidence is high
    if len(tech_grades) < 2 and final_score > 5.0:
        final_score = min(final_score, 4.0)
        decision = "REJECT"
        criteria += " (Insufficient Technical Depth)"

    return decision, final_score, criteria
