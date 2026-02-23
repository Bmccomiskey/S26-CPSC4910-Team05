# This file is for establishing connectivity with the MySQL Database

import os
import mysql.connector
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "cpsc4910-s26.cobd8enwsupz.us-east-1.rds.amazonaws.com")
DB_USER = os.getenv("DB_USER", "Team05")
DB_NAME = os.getenv("DB_NAME", "Team05_DB")
DB_PORT = os.getenv("DB_PORT", "3306")

if not DB_PASSWORD:
    raise RuntimeError("DB_PASSWORD is not set. Please add it to your .env file.")

# SQLAlchemy engine — used by FastAPI/SQLAlchemy ORM (get_db, models, etc.)
DATABASE_URL = (
    f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Raw mysql.connector connection — kept for any direct queries your team uses
def dbConnect():
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            port=int(DB_PORT),
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            ssl_disabled=False,
            ssl_ca='/certs/global-bundle.pem'
        )
        print("Connection established successfully")
        return conn
    except Exception as e:
        print(f"Database error: {e}")
        return None

def get_db_info() -> dict:
    
    conn = dbConnect()

    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Version_Info")

    result = cursor.fetchall()

    return {
        "team": result[0][0],
        "version": result[0][1],
        "date": result[0][2]
    }

# Close a raw connection
def dbConnClose(conn):
    if conn:
        conn.close()
        print("Connection closed")
