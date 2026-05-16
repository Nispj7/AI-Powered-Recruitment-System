import mysql.connector
import json
import os
from dotenv import load_dotenv

load_dotenv()

# DB Config
db_config = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME", "aichatbot")
}


def check_latest_session():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Get latest completed session
        cursor.execute("SELECT * FROM sessions ORDER BY id DESC LIMIT 1")
        session = cursor.fetchone()
        
        if not session:
            print("No sessions found.")
            return

        print(f"=== SESSION {session['id']} ===")
        print(f"Status: {session['status']}, Score: {session['final_score']}, Decision: {session['final_decision']}")
        
        # Get turns for this session
        cursor.execute("SELECT q_no, question, answer_text, phase, gpt_grade, text_confidence, stress_score, neg_hits FROM turns WHERE session_id = %s", (session['id'],))
        turns = cursor.fetchall()
        
        for t in turns:
            print(f"\nTurn {t['q_no']} ({t['phase']}): {t['question']}")
            print(f"Answer: {t['answer_text']}")
            print(f"Grade: {t['gpt_grade']}, Conf: {t['text_confidence']}, Stress: {t['stress_score']}")
            print(f"Neg Hits: {t['neg_hits']}")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_latest_session()
