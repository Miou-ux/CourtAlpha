"""Scope utilisateur connecté — bankroll et accès API."""

from __future__ import annotations



import sqlite3



from fastapi import HTTPException



from api.auth_tokens import auth_required





def telegram_uid(user: dict | None) -> str | None:

    tg = str((user or {}).get("telegram_user_id") or "").strip()

    return tg or None





def web_username(user: dict | None) -> str | None:

    uname = str((user or {}).get("username") or "").strip().lower()

    return uname or None





def portfolio_scope(user: dict | None) -> tuple[str, str]:

    """Retourne (scope, key) — telegram|web|unlinked."""

    tg = telegram_uid(user)

    if tg:

        return "telegram", tg

    uname = web_username(user)

    if uname:

        return "web", uname

    return "unlinked", ""





def require_authenticated_user(user: dict | None) -> dict:

    if not user:

        if auth_required():

            raise HTTPException(status_code=401, detail="Authentification requise")

        raise HTTPException(status_code=401, detail="Authentification requise")

    return user





def bet_belongs_to_user(bet: dict, user: dict | None) -> bool:

    scope, key = portfolio_scope(user)

    if scope == "telegram":

        bet_tg = str(bet.get("telegram_user_id") or "").strip()

        return not bet_tg or bet_tg == key

    if scope == "web":

        bet_web = str(bet.get("web_username") or "").strip().lower()

        return bet_web == key

    return False





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



    uname = web_username(user)

    if uname:

        from scripts.bets_db import compute_web_user_bankroll_eur



        snap = compute_web_user_bankroll_eur(conn, uname)

        snap["bankroll_mode"] = "web"

        snap["web_username"] = uname

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

        "web_username": None,

    }


def existing_stakes_index(conn: sqlite3.Connection, user: dict | None) -> dict[tuple[str, str], float]:
    """Mises cumulées par (match_name, bet_on) pour le compte connecté."""
    scope, key = portfolio_scope(user)
    if scope == "unlinked" or not key:
        return {}
    if scope == "telegram":
        rows = conn.execute(
            """
            SELECT match_name, bet_on, COALESCE(SUM(stake), 0)
            FROM user_bets
            WHERE telegram_user_id = ?
            GROUP BY match_name, bet_on
            """,
            (key,),
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT match_name, bet_on, COALESCE(SUM(stake), 0)
            FROM user_bets
            WHERE LOWER(COALESCE(web_username, '')) = ?
            GROUP BY match_name, bet_on
            """,
            (key.lower(),),
        ).fetchall()
    return {(str(r[0]), str(r[1])): float(r[2] or 0.0) for r in rows}


def _pick_bet_keys(pick: dict) -> list[tuple[str, str]]:
    bet_on = str(pick.get("bet_on") or pick.get("fav_player") or "").strip()
    if not bet_on:
        return []
    keys: list[tuple[str, str]] = []
    match_name = str(pick.get("match_name") or "").strip()
    if match_name:
        keys.append((match_name, bet_on))
    p1 = str(pick.get("player1") or "").strip()
    p2 = str(pick.get("player2") or "").strip()
    if p1 and p2:
        alt = f"{p1} vs {p2}"
        keys.append((alt, bet_on))
    opp = str(pick.get("opponent") or pick.get("underdog_player") or "").strip()
    if opp:
        keys.append((f"{bet_on} vs {opp}", bet_on))
    return keys


def existing_stake_for_pick(index: dict[tuple[str, str], float], pick: dict) -> float:
    for key in _pick_bet_keys(pick):
        stake = float(index.get(key) or 0.0)
        if stake > 0:
            return stake
    return 0.0


def enrich_picks_existing_stake(picks: list[dict], index: dict[tuple[str, str], float]) -> None:
    for pick in picks:
        pick["existing_stake_eur"] = existing_stake_for_pick(index, pick)

