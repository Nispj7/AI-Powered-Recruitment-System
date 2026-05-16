def generate_report(candidate_name, session_id, turns, decision, final_score, criteria):
    """
    Generates a professional markdown assessment report in the format expected by AdminDashboard.jsx.
    """
    total_turns = len(turns)
    avg_conf = sum(t.get("text_confidence") or 0.0 for t in turns) / total_turns if total_turns > 0 else 0.0
    avg_stress = sum(t.get("stress_score") or 0.0 for t in turns) / total_turns if total_turns > 0 else 0.0
    tech_grades = [t.get("gpt_grade") for t in turns if t.get("gpt_grade") is not None]
    avg_tech = sum(tech_grades) / len(tech_grades) if tech_grades else 0.0
    
    # Check if audio was used at all
    used_audio = any(t.get("answer_mode") == "audio" for t in turns)
    composure_label = "Speech Composure" if used_audio else "Response Composure"
    
    composure = 1.0 - avg_stress
    emotional_state = "Calm & Composed" if composure > 0.7 else "Slightly Anxious"
    
    # Simple logic for highlights
    strengths = "Good technical communication" if used_audio else "Clear and structured text responses"
    growth = "Could provide more detailed examples"
    
    # AdminDashboard.jsx regexes expect specific bolded labels.
    # We update the label dynamically but keep the bold format.
    report = f"**Domain:** General\n"
    report += f"**Final Grade:** {final_score}/10.0\n"
    report += f"**Emotional state:** {emotional_state}\n"
    report += f"**Strengths:** {strengths}\n"
    report += f"**Growth Areas:** {growth}\n"
    report += f"**Final Decision:** {decision}\n\n"
    
    report += f"**Technical Depth (40%):** {int(avg_tech * 10)}%\n"
    report += f"**Confidence Level (40%):** {int(avg_conf * 100)}% \n"
    report += f"**{composure_label} (20%):** {int(composure * 100)}%\n\n"
    
    report += "### 💬 History\n"
    for t in turns:
        mode_icon = "🎤" if t.get("answer_mode") == "audio" else "⌨️"
        report += f"#### Turn {t['q_no']} ({mode_icon}): {t['question']}\n"
        report += f"A: {t.get('answer_text', '...')}\n\n"
        
    return report
