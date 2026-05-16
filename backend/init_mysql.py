import mysql.connector
from db import DB_CONFIG

def init_db():
    try:
        # Connect to MySQL (without database initially to create it)
        temp_config = DB_CONFIG.copy()
        db_name = temp_config.pop("database")
        
        conn = mysql.connector.connect(**temp_config)
        cur = conn.cursor()
        
        # Create Database
        cur.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        cur.execute(f"USE {db_name}")
        
        # Create Users Table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                role VARCHAR(50) DEFAULT 'candidate'
            )
        """)

        # Create Sessions Table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                started_at VARCHAR(50),
                ended_at VARCHAR(50),
                status VARCHAR(20) DEFAULT 'ACTIVE',
                current_q INT DEFAULT 0,
                phase VARCHAR(20) DEFAULT 'warmup',
                final_decision VARCHAR(50),
                final_score DECIMAL(5,2),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        # Create Turns Table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS turns (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT NOT NULL,
                q_no INT,
                question TEXT,
                answer_text TEXT,
                answer_mode VARCHAR(20),
                sentiment_label VARCHAR(20),
                text_confidence FLOAT,
                stress_score FLOAT,
                keywords TEXT,
                pos_hits TEXT,
                neg_hits TEXT,
                reasoning TEXT,
                phase VARCHAR(20),
                gpt_grade INT,
                gpt_grade_feedback TEXT,
                created_at VARCHAR(50),
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)

        # Ensure columns exist in reports
        try:
            cur.execute("ALTER TABLE reports ADD COLUMN email VARCHAR(255) AFTER candidate_name")
        except: pass
        try:
            cur.execute("ALTER TABLE reports ADD COLUMN session_id INT AFTER id")
        except: pass
        try:
            cur.execute("ALTER TABLE reports ADD COLUMN interview_time DATETIME AFTER performance_json")
        except: pass

        # Seed default users
        cur.execute("INSERT IGNORE INTO users (id, email, password, full_name, role) VALUES (0, 'admin@system.local', '123456', 'Super Admin', 'admin')")
        cur.execute("INSERT IGNORE INTO users (email, password, full_name, role) VALUES ('candidate1@gmail.com', 'password123', 'Candidate One', 'candidate')")
        cur.execute("INSERT IGNORE INTO users (email, password, full_name, role) VALUES ('nisargpj7@gmail.com', '123456', 'Admin Admin', 'admin')")
        
        # Create Feedback Table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT NOT NULL,
                rating INT NOT NULL,
                comments TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)
        
        print(f"Database '{db_name}', tables, and feedback initialized successfully.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error initializing MySQL: {e}")

if __name__ == "__main__":
    init_db()
