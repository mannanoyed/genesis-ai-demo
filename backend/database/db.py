import sqlite3
import json
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "leads.db"


def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize the SQLite database with required tables."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id TEXT,
            name TEXT,
            email TEXT,
            phone TEXT,
            vehicle_interest TEXT,
            intent_score TEXT DEFAULT 'cold',
            conversation_summary TEXT,
            priorities TEXT,
            budget_level TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id TEXT UNIQUE,
            vehicle_context TEXT,
            profile_data TEXT,
            message_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()
    print("Database initialized successfully.")


def save_lead(
    conversation_id: str,
    name: str,
    email: str,
    phone: str,
    vehicle_interest: str = None,
    intent_score: str = "cold",
    conversation_summary: str = None,
    priorities: list = None,
    budget_level: str = None,
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO leads (
            conversation_id, name, email, phone, vehicle_interest,
            intent_score, conversation_summary, priorities, budget_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        conversation_id,
        name,
        email,
        phone,
        vehicle_interest,
        intent_score,
        conversation_summary,
        json.dumps(priorities or []),
        budget_level,
    ))

    lead_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return lead_id


def upsert_conversation(conversation_id: str, vehicle_context: str = None, profile_data: dict = None):
    conn = get_connection()
    cursor = conn.cursor()

    existing = cursor.execute(
        "SELECT id FROM conversations WHERE conversation_id = ?", (conversation_id,)
    ).fetchone()

    if existing:
        cursor.execute("""
            UPDATE conversations
            SET vehicle_context = ?, profile_data = ?, message_count = message_count + 1, updated_at = ?
            WHERE conversation_id = ?
        """, (vehicle_context, json.dumps(profile_data or {}), datetime.utcnow().isoformat(), conversation_id))
    else:
        cursor.execute("""
            INSERT INTO conversations (conversation_id, vehicle_context, profile_data, message_count)
            VALUES (?, ?, ?, 1)
        """, (conversation_id, vehicle_context, json.dumps(profile_data or {})))

    conn.commit()
    conn.close()


def get_all_leads():
    conn = get_connection()
    cursor = conn.cursor()
    rows = cursor.execute("SELECT * FROM leads ORDER BY timestamp DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]
