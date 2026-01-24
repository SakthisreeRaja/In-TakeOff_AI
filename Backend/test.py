from dotenv import load_dotenv
import os

load_dotenv()

# Check what's actually loaded
db_url = os.getenv("DATABASE_URL")
print(f"Raw DATABASE_URL: '{db_url}'")
print(f"Length: {len(db_url) if db_url else 'None'}")

# Check if there are extra spaces
if db_url:
    if db_url.startswith(' ') or db_url.endswith(' '):
        print("⚠️  DATABASE_URL has leading/trailing spaces!")
    else:
        print("✅ DATABASE_URL format looks good")

# Test connection
try:
    import psycopg2
    conn = psycopg2.connect(db_url)
    print("✅ Database connection successful!")
    conn.close()
except Exception as e:
    print(f"❌ Connection error: {e}")