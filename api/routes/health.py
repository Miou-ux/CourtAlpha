from __future__ import annotations

from fastapi import APIRouter

from api.bridge import bootstrap_bettinghud
from api.config import bettinghud_root

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    root = bettinghud_root()
    exists = root.is_dir()
    if exists:
        try:
            bootstrap_bettinghud()
        except FileNotFoundError:
            exists = False
    return {
        "status": "ok" if exists else "degraded",
        "service": "bettinghud-web-api",
        "bettinghud_root": str(root),
        "bettinghud_root_exists": exists,
    }
