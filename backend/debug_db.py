import mysql.connector
from db import DB_CONFIG

def debug():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cur = conn.cursor(dictionary=True)
        
        print("--- Database Debug ---")
        cur.execute("SHOW TABLES")
        tables = [list(t.values())[0] for t in cur.fetchall()]
        print(f"Tables found: {tables}")
        
        print("\n--- Schema of 'reports' ---")
        cur.execute("DESCRIBE reports")
        for col in cur.fetchall():
            print(col)
            
        print("\n--- Rows in 'reports' ---")
        cur.execute("SELECT * FROM reports LIMIT 5")
        rows = cur.fetchall()
        for r in rows:
            # Avoid printing full JSON/Report to avoid charmap errors
            print({k: v for k, v in r.items() if k != 'performance_json'})
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    debug()
