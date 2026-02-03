"""
SQLite database for users and saved speeches.
"""

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).parent / "speeches.db"


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = _get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            picture TEXT,
            provider TEXT NOT NULL DEFAULT 'google',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS speeches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            topic TEXT NOT NULL,
            final_text TEXT,
            stages_json TEXT,
            word_count INTEGER,
            audio_data BLOB,
            audio_voice TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_speeches_user ON speeches(user_id);
    """)
    # Migration: add audio columns if they don't exist (for existing DBs)
    try:
        conn.execute("ALTER TABLE speeches ADD COLUMN audio_data BLOB")
    except sqlite3.OperationalError:
        pass
    try:
        conn.execute("ALTER TABLE speeches ADD COLUMN audio_voice TEXT")
    except sqlite3.OperationalError:
        pass
    conn.commit()
    conn.close()


# --- User operations ---

def get_or_create_user(email: str, name: str, picture: str = "", provider: str = "google") -> dict:
    """Find existing user by email or create new one. Returns user dict."""
    conn = _get_conn()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if row:
        conn.close()
        return dict(row)

    now = datetime.now(timezone.utc).isoformat()
    cursor = conn.execute(
        "INSERT INTO users (email, name, picture, provider, created_at) VALUES (?, ?, ?, ?, ?)",
        (email, name, picture, provider, now),
    )
    conn.commit()
    user_id = cursor.lastrowid
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row)


# --- Speech operations ---

def save_speech(user_id: int, topic: str, final_text: str, stages: list) -> int:
    """Save a completed speech. Returns speech id."""
    conn = _get_conn()
    now = datetime.now(timezone.utc).isoformat()
    word_count = len(final_text.split()) if final_text else 0

    # Convert stages to JSON-safe format
    stages_json = json.dumps(
        [{"name": s[0], "type": s[1], "data": _sanitize_data(s[2])} for s in stages],
        ensure_ascii=False,
    )

    cursor = conn.execute(
        "INSERT INTO speeches (user_id, topic, final_text, stages_json, word_count, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, topic, final_text, stages_json, word_count, now),
    )
    conn.commit()
    speech_id = cursor.lastrowid
    conn.close()
    return speech_id


def get_user_speeches(user_id: int) -> list[dict]:
    """Get all speeches for a user, newest first."""
    conn = _get_conn()
    rows = conn.execute(
        "SELECT id, topic, word_count, created_at FROM speeches "
        "WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_speech(speech_id: int, user_id: int) -> dict | None:
    """Get a single speech with all stages. Returns None if not found or wrong user."""
    conn = _get_conn()
    row = conn.execute(
        "SELECT * FROM speeches WHERE id = ? AND user_id = ?",
        (speech_id, user_id),
    ).fetchone()
    conn.close()
    if row:
        result = dict(row)
        result["stages"] = json.loads(result["stages_json"]) if result["stages_json"] else []
        return result
    return None


def save_audio(speech_id: int, user_id: int, audio_data: bytes, voice: str):
    """Save generated audio to an existing speech."""
    conn = _get_conn()
    conn.execute(
        "UPDATE speeches SET audio_data = ?, audio_voice = ? WHERE id = ? AND user_id = ?",
        (audio_data, voice, speech_id, user_id),
    )
    conn.commit()
    conn.close()


def get_audio(speech_id: int, user_id: int) -> bytes | None:
    """Get audio data for a speech. Returns None if no audio."""
    conn = _get_conn()
    row = conn.execute(
        "SELECT audio_data FROM speeches WHERE id = ? AND user_id = ?",
        (speech_id, user_id),
    ).fetchone()
    conn.close()
    if row and row["audio_data"]:
        return bytes(row["audio_data"])
    return None


def delete_speech(speech_id: int, user_id: int) -> bool:
    """Delete a speech. Returns True if deleted."""
    conn = _get_conn()
    cursor = conn.execute(
        "DELETE FROM speeches WHERE id = ? AND user_id = ?",
        (speech_id, user_id),
    )
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted


def _sanitize_data(data: dict) -> dict:
    """Make stage data JSON-serializable."""
    clean = {}
    for k, v in data.items():
        if isinstance(v, list):
            clean[k] = [
                _sanitize_data(item) if isinstance(item, dict) else item
                for item in v
            ]
        elif isinstance(v, dict):
            clean[k] = _sanitize_data(v)
        else:
            clean[k] = v
    return clean


# Initialize on import
init_db()
