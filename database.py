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
            created_at TEXT NOT NULL,
            stripe_customer_id TEXT,
            stripe_subscription_id TEXT,
            subscription_status TEXT DEFAULT 'none'
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

        CREATE TABLE IF NOT EXISTS reflections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            mode TEXT NOT NULL,
            module TEXT,
            exercise TEXT,
            context TEXT NOT NULL,
            result TEXT NOT NULL,
            audio_data BLOB,
            audio_voice TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_reflections_user ON reflections(user_id);
        CREATE INDEX IF NOT EXISTS idx_reflections_mode ON reflections(mode);

        CREATE TABLE IF NOT EXISTS user_streaks (
            user_id INTEGER PRIMARY KEY,
            current_streak INTEGER DEFAULT 0,
            longest_streak INTEGER DEFAULT 0,
            last_activity_date TEXT,
            total_reflections INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
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
    # Migration: add subscription columns to users table
    try:
        conn.execute("ALTER TABLE users ADD COLUMN stripe_customer_id TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        conn.execute("ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        conn.execute("ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'none'")
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


# --- Subscription operations ---

def update_user_subscription(
    user_id: int,
    customer_id: str,
    subscription_id: str,
    status: str = "active",
):
    """Update user's Stripe subscription info."""
    conn = _get_conn()
    conn.execute(
        """UPDATE users SET
           stripe_customer_id = ?,
           stripe_subscription_id = ?,
           subscription_status = ?
           WHERE id = ?""",
        (customer_id, subscription_id, status, user_id),
    )
    conn.commit()
    conn.close()


def get_user_subscription(user_id: int) -> dict:
    """Get user's subscription info."""
    conn = _get_conn()
    row = conn.execute(
        "SELECT stripe_customer_id, stripe_subscription_id, subscription_status FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    conn.close()
    if row:
        return {
            "customer_id": row["stripe_customer_id"],
            "subscription_id": row["stripe_subscription_id"],
            "status": row["subscription_status"] or "none",
        }
    return {"customer_id": None, "subscription_id": None, "status": "none"}


def update_subscription_status(user_id: int, status: str):
    """Update just the subscription status."""
    conn = _get_conn()
    conn.execute(
        "UPDATE users SET subscription_status = ? WHERE id = ?",
        (status, user_id),
    )
    conn.commit()
    conn.close()


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


def count_user_speeches(user_id: int) -> int:
    """Count total speeches created by a user."""
    conn = _get_conn()
    row = conn.execute(
        "SELECT COUNT(*) as count FROM speeches WHERE user_id = ?",
        (user_id,),
    ).fetchone()
    conn.close()
    return row["count"] if row else 0


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


# --- Reflection operations (Sovereign Mind) ---

def save_reflection(
    user_id: int,
    mode: str,
    module: str | None,
    exercise: str | None,
    context: str,
    result: str,
) -> int:
    """Save a Sovereign Mind reflection. Returns reflection id."""
    conn = _get_conn()
    now = datetime.now(timezone.utc).isoformat()

    cursor = conn.execute(
        "INSERT INTO reflections (user_id, mode, module, exercise, context, result, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (user_id, mode, module, exercise, context, result, now),
    )
    conn.commit()
    reflection_id = cursor.lastrowid

    # Update streak
    _update_streak(conn, user_id)

    conn.close()
    return reflection_id


def save_reflection_audio(reflection_id: int, user_id: int, audio_data: bytes, voice: str):
    """Save audio for a reflection."""
    conn = _get_conn()
    conn.execute(
        "UPDATE reflections SET audio_data = ?, audio_voice = ? WHERE id = ? AND user_id = ?",
        (audio_data, voice, reflection_id, user_id),
    )
    conn.commit()
    conn.close()


def get_reflection_audio(reflection_id: int, user_id: int) -> bytes | None:
    """Get audio for a reflection."""
    conn = _get_conn()
    row = conn.execute(
        "SELECT audio_data FROM reflections WHERE id = ? AND user_id = ?",
        (reflection_id, user_id),
    ).fetchone()
    conn.close()
    if row and row["audio_data"]:
        return bytes(row["audio_data"])
    return None


def get_user_reflections(user_id: int, limit: int = 50, mode: str | None = None) -> list[dict]:
    """Get reflections for a user, newest first."""
    conn = _get_conn()
    if mode:
        rows = conn.execute(
            "SELECT id, mode, module, exercise, context, result, created_at FROM reflections "
            "WHERE user_id = ? AND mode = ? ORDER BY created_at DESC LIMIT ?",
            (user_id, mode, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT id, mode, module, exercise, context, result, created_at FROM reflections "
            "WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_reflection(reflection_id: int, user_id: int) -> dict | None:
    """Get a single reflection."""
    conn = _get_conn()
    row = conn.execute(
        "SELECT * FROM reflections WHERE id = ? AND user_id = ?",
        (reflection_id, user_id),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def delete_reflection(reflection_id: int, user_id: int) -> bool:
    """Delete a reflection."""
    conn = _get_conn()
    cursor = conn.execute(
        "DELETE FROM reflections WHERE id = ? AND user_id = ?",
        (reflection_id, user_id),
    )
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted


def count_user_reflections(user_id: int) -> int:
    """Count total reflections by a user."""
    conn = _get_conn()
    row = conn.execute(
        "SELECT COUNT(*) as count FROM reflections WHERE user_id = ?",
        (user_id,),
    ).fetchone()
    conn.close()
    return row["count"] if row else 0


# --- Streak operations ---

def _update_streak(conn: sqlite3.Connection, user_id: int):
    """Update user's streak (called within a transaction)."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    row = conn.execute(
        "SELECT * FROM user_streaks WHERE user_id = ?", (user_id,)
    ).fetchone()

    if not row:
        # First reflection ever
        conn.execute(
            "INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_reflections) "
            "VALUES (?, 1, 1, ?, 1)",
            (user_id, today),
        )
    else:
        last_date = row["last_activity_date"]
        current = row["current_streak"] or 0
        longest = row["longest_streak"] or 0
        total = row["total_reflections"] or 0

        if last_date == today:
            # Already active today, just increment total
            conn.execute(
                "UPDATE user_streaks SET total_reflections = ? WHERE user_id = ?",
                (total + 1, user_id),
            )
        else:
            # Check if yesterday
            from datetime import timedelta
            yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")

            if last_date == yesterday:
                # Continue streak
                new_streak = current + 1
                new_longest = max(longest, new_streak)
            else:
                # Streak broken
                new_streak = 1
                new_longest = longest

            conn.execute(
                "UPDATE user_streaks SET current_streak = ?, longest_streak = ?, "
                "last_activity_date = ?, total_reflections = ? WHERE user_id = ?",
                (new_streak, new_longest, today, total + 1, user_id),
            )


def get_user_streak(user_id: int) -> dict:
    """Get user's streak info."""
    conn = _get_conn()
    row = conn.execute(
        "SELECT * FROM user_streaks WHERE user_id = ?", (user_id,)
    ).fetchone()
    conn.close()

    if row:
        # Check if streak is still valid
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        from datetime import timedelta
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")

        last_date = row["last_activity_date"]
        current = row["current_streak"] or 0

        # If last activity was before yesterday, streak is broken
        if last_date and last_date < yesterday:
            current = 0

        return {
            "current_streak": current,
            "longest_streak": row["longest_streak"] or 0,
            "last_activity_date": last_date,
            "total_reflections": row["total_reflections"] or 0,
        }

    return {
        "current_streak": 0,
        "longest_streak": 0,
        "last_activity_date": None,
        "total_reflections": 0,
    }


def get_reflection_stats(user_id: int) -> dict:
    """Get detailed reflection stats for a user."""
    conn = _get_conn()

    # Total by mode
    rows = conn.execute(
        "SELECT mode, COUNT(*) as count FROM reflections WHERE user_id = ? GROUP BY mode",
        (user_id,),
    ).fetchall()
    by_mode = {r["mode"]: r["count"] for r in rows}

    # This week's reflections
    from datetime import timedelta
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    row = conn.execute(
        "SELECT COUNT(*) as count FROM reflections WHERE user_id = ? AND created_at > ?",
        (user_id, week_ago),
    ).fetchone()
    this_week = row["count"] if row else 0

    conn.close()

    streak = get_user_streak(user_id)

    return {
        "by_mode": by_mode,
        "this_week": this_week,
        **streak,
    }


# Initialize on import
init_db()
