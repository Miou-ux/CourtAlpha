"""Sessions web simples (PREPROD) — tokens en mémoire."""
from __future__ import annotations

import os
import secrets
import time
from typing import Any

_TOKENS: dict[str, dict[str, Any]] = {}
_DEFAULT_TTL_SEC = 7 * 24 * 3600


def auth_required() -> bool:
    return os.getenv("BETTINGHUD_WEB_AUTH_REQUIRED", "0").strip().lower() in {"1", "true", "yes"}


def issue_token(user: dict[str, Any], *, ttl_sec: int | None = None) -> str:
    ttl = int(ttl_sec or os.getenv("BETTINGHUD_WEB_TOKEN_TTL_SEC", str(_DEFAULT_TTL_SEC)))
    token = secrets.token_urlsafe(32)
    _TOKENS[token] = {"user": dict(user), "expires": time.time() + ttl}
    return token


def resolve_token(token: str | None) -> dict[str, Any] | None:
    if not token:
        return None
    rec = _TOKENS.get(token)
    if not rec:
        return None
    if float(rec.get("expires") or 0) < time.time():
        _TOKENS.pop(token, None)
        return None
    return dict(rec.get("user") or {})


def revoke_token(token: str | None) -> None:
    if token:
        _TOKENS.pop(token, None)


def refresh_token_user(token: str | None, user: dict[str, Any]) -> None:
    if not token:
        return
    rec = _TOKENS.get(token)
    if rec and float(rec.get("expires") or 0) >= time.time():
        rec["user"] = dict(user)
