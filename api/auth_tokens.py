"""Sessions web CourtAlpha — tokens persistés en SQLite (survit aux redémarrages API)."""
from __future__ import annotations

import os
import secrets
import sqlite3
import time
from datetime import datetime, timezone
from typing import Any

_DEFAULT_TTL_SEC = 7 * 24 * 3600


def auth_required() -> bool:
    return os.getenv("BETTINGHUD_WEB_AUTH_REQUIRED", "0").strip().lower() in {"1", "true", "yes"}


def _ttl_sec(ttl_sec: int | None = None) -> int:
    return int(ttl_sec or os.getenv("BETTINGHUD_WEB_TOKEN_TTL_SEC", str(_DEFAULT_TTL_SEC)))


def _slide_enabled() -> bool:
    raw = os.getenv("BETTINGHUD_WEB_TOKEN_SLIDE", "1").strip().lower()
    return raw not in {"0", "false", "no", "off"}


def _db_path() -> str:
    from api.bridge import bootstrap_bettinghud

    bootstrap_bettinghud()
    from scripts.bets_db import DB_PATH_DEFAULT

    return DB_PATH_DEFAULT


def _ensure_schema(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS web_api_tokens (
            token TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            expires_at REAL NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_web_api_tokens_username ON web_api_tokens(username)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_web_api_tokens_expires ON web_api_tokens(expires_at)"
    )
    conn.commit()


def _purge_expired(conn: sqlite3.Connection) -> None:
    conn.execute("DELETE FROM web_api_tokens WHERE expires_at < ?", (time.time(),))
    conn.commit()


def issue_token(user: dict[str, Any], *, ttl_sec: int | None = None) -> str:
    username = str(user.get("username") or "").strip().lower()
    if not username:
        raise ValueError("username requis pour émettre un token")
    token = secrets.token_urlsafe(32)
    expires = time.time() + _ttl_sec(ttl_sec)
    created = datetime.now(timezone.utc).isoformat()
    path = _db_path()
    with sqlite3.connect(path) as conn:
        _ensure_schema(conn)
        _purge_expired(conn)
        conn.execute(
            "INSERT INTO web_api_tokens (token, username, expires_at, created_at) VALUES (?, ?, ?, ?)",
            (token, username, expires, created),
        )
        conn.commit()
    return token


def resolve_token(token: str | None) -> dict[str, Any] | None:
    if not token:
        return None
    path = _db_path()
    with sqlite3.connect(path) as conn:
        conn.row_factory = sqlite3.Row
        _ensure_schema(conn)
        row = conn.execute(
            "SELECT username, expires_at FROM web_api_tokens WHERE token = ?",
            (token,),
        ).fetchone()
        if not row:
            return None
        expires_at = float(row["expires_at"] or 0)
        if expires_at < time.time():
            conn.execute("DELETE FROM web_api_tokens WHERE token = ?", (token,))
            conn.commit()
            return None
        if _slide_enabled():
            new_expires = time.time() + _ttl_sec()
            conn.execute(
                "UPDATE web_api_tokens SET expires_at = ? WHERE token = ?",
                (new_expires, token),
            )
            conn.commit()
    from scripts.web_auth import get_web_user_session

    return get_web_user_session(str(row["username"]))


def revoke_token(token: str | None) -> None:
    if not token:
        return
    path = _db_path()
    with sqlite3.connect(path) as conn:
        _ensure_schema(conn)
        conn.execute("DELETE FROM web_api_tokens WHERE token = ?", (token,))
        conn.commit()


def refresh_token_user(token: str | None, user: dict[str, Any]) -> None:
    """No-op : le profil est relu depuis web_users.json à chaque resolve_token."""
    _ = (token, user)
