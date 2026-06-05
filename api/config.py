"""Configuration CourtAlpha (PREPROD) — lit le moteur dans BettingHUD/."""
from __future__ import annotations

import os
from pathlib import Path

WEB_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BETTINGHUD_ROOT = WEB_ROOT.parent / "BettingHUD"


def bettinghud_root() -> Path:
    raw = os.getenv("BETTINGHUD_ROOT", "").strip()
    root = Path(raw) if raw else DEFAULT_BETTINGHUD_ROOT
    return root.resolve()


def cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:5173").strip()
    return [x.strip() for x in raw.split(",") if x.strip()]
