from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# 1. DEFINE BASE AT THE TOP LEVEL
# This prevents the "ImportError: cannot import name 'Base'" in other files.
Base = declarative_base()

# 2. LOAD ENVIRONMENT VARIABLES
# Try root first, then local
load_dotenv(dotenv_path="../.env") 
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("WARNING: Could not find .env in ../.env, trying local backend/.env")
    load_dotenv()
    DATABASE_URL = os.getenv("DATABASE_URL")

# 3. FALLBACK SAFETY
# If still None, use the default Docker Postgres URL to prevent a crash
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:password123@localhost:5432/marketplace_db"
    print(f"⚠️ No DATABASE_URL found. Using fallback: {DATABASE_URL}")

# 4. INITIALIZE ENGINE & SESSION
try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    print("✅ Database Connection Initialized.")
except Exception as e:
    print(f"❌ ERROR: Database connection failed. URL: {DATABASE_URL}")
    print(f"Error Details: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()