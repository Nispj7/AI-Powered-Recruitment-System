from db import execute

def init():
    # Users: prototype login (password stored plain) as you requested (NOT secure; acceptable for research prototype)
    execute("""
    CREATE TABLE IF NOT EXISTS users(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
    """)

    # Sessions: one per interview attempt
    execute("""
    CREATE TABLE IF NOT EXISTS sessions(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      status TEXT NOT NULL, -- ACTIVE/COMPLETED
      current_q INTEGER NOT NULL DEFAULT 0,
      phase TEXT NOT NULL DEFAULT 'warmup', -- warmup/theory/coding/closing
      topics TEXT DEFAULT '',
      final_decision TEXT DEFAULT '',
      final_score REAL DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    # Turns/messages: each question-answer pair + ML + reasoning
    execute("""
    CREATE TABLE IF NOT EXISTS turns(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      q_no INTEGER NOT NULL,
      question TEXT NOT NULL,
      answer_text TEXT DEFAULT '',
      answer_mode TEXT DEFAULT 'text', -- text/audio
      sentiment_label TEXT DEFAULT '',
      text_confidence REAL DEFAULT 0,
      stress_score REAL DEFAULT 0,
      keywords TEXT DEFAULT '',
      pos_hits TEXT DEFAULT '',
      neg_hits TEXT DEFAULT '',
      gpt_grade REAL DEFAULT -1,
      gpt_grade_feedback TEXT DEFAULT '',
      reasoning TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    )
    """)

    # Reports: generated at end
    execute("""
    CREATE TABLE IF NOT EXISTS reports(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      report_text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    )
    """)

    # Seed user (optional)
    try:
        execute("INSERT INTO users(username,password) VALUES(?,?)", ("candidate1", "password123"))
    except Exception:
        pass

    print("✅ DB initialized.")

if __name__ == "__main__":
    init()
