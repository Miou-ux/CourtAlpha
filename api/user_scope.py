"""Scope utilisateur connecté — bankroll et accès API."""
from __future__ import annotations

import sqlite3

from fastapi import HTTPException

from api.auth_tokens import auth_required


def telegram_uid(user: dict | None) -> str | None:
    tg = str((user or {}).get("telegram_user_id") or "").strip()
    return tg or None


def require_authenticated_user(user: dict | None) -> dict:
    if not user:
        if auth_required():
            raise HTTPException(status_code=401, detail="Authentification requise")
        raise HTTPException(status_code=401, detail="Authentification requise")
    return user


def bankroll_for_user(conn: sqlite3.Connection, user: dict | None) -> dict | None:
    """Bankroll du compte connecté. ``None`` si visiteur anonyme (jamais de BR globale)."""
    if not user:
        return None

    tg = telegram_uid(user)
    if tg:
        from scripts.bets_db import compute_telegram_user_bankroll_eur

        snap = compute_telegram_user_bankroll_eur(conn, tg)
        snap["bankroll_mode"] = "telegram"
        snap["telegram_user_id"] = tg
        return snap

    return {
        "start_eur": 0.0,
        "available_eur": 0.0,
        "available_raw_eur": 0.0,
        "equity_eur": 0.0,
        "committed_open_eur": 0.0,
        "settled_profit_eur": 0.0,
        "manual_adjust_eur": 0.0,
        "bankroll_mode": "unlinked",
        "telegram_user_id": None,
    }
