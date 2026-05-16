import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

# DB Config
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME", "aichatbot")
}


def get_conn():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def query_one(sql, params=()):
    print(f"DEBUG SQL: {sql} | PARAMS: {params}")
    conn = get_conn()
    if not conn: return None
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(sql, params)
        row = cur.fetchone()
        return row
    finally:
        cur.close()
        conn.close()

def query_all(sql, params=()):
    print(f"DEBUG SQL: {sql} | PARAMS: {params}")
    conn = get_conn()
    if not conn: return []
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(sql, params)
        rows = cur.fetchall()
        return rows
    finally:
        cur.close()
        conn.close()

def execute(sql, params=()):
    print(f"DEBUG SQL: {sql} | PARAMS: {params}")
    conn = get_conn()
    if not conn: return None
    cur = conn.cursor()
    try:
        cur.execute(sql, params)
        conn.commit()
        last_id = cur.lastrowid
        return last_id
    finally:
        cur.close()
        conn.close()
