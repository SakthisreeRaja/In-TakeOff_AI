from dotenv import load_dotenv
import os
import psycopg2

load_dotenv()

db_url = os.getenv("DATABASE_URL")
print(f"DATABASE_URL: {db_url}")

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    result = cursor.fetchone()
    print(f"✅ Connected successfully! PostgreSQL: {result[0]}")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"❌ Connection failed: {e}")