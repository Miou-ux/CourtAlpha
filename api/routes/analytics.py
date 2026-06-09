from __future__ import annotations

import os

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel, Field

from api.bridge import bootstrap_bettinghud
from api.config import bettinghud_root
from api.routes.auth import current_user, require_admin
from api.serialize import to_jsonable
from api.services.web_traffic import build_traffic_report, record_page_view

router = APIRouter(prefix="/analytics", tags=["analytics"])


class PageViewRequest(BaseModel):
    path: str = Field(..., min_length=1, max_length=200)
    referrer: str | None = Field(default=None, max_length=500)
    utm_source: str | None = Field(default=None, max_length=80)
    utm_medium: str | None = Field(default=None, max_length=80)
    utm_campaign: str | None = Field(default=None, max_length=120)


def _db_path() -> str:
    bootstrap_bettinghud()
    from scripts.bets_db import DB_PATH_DEFAULT

    path = str(bettinghud_root() / "data" / "bettinghud.db")
    if not os.path.isfile(path):
        path = DB_PATH_DEFAULT
    return path


@router.post("/pageview")
def analytics_pageview(
    request: Request,
    body: PageViewRequest,
    user: dict | None = Depends(current_user),
) -> dict:
    """Enregistre une vue de page SPA (public, léger)."""
    path = body.path
    referrer = body.referrer
    username = str((user or {}).get("username") or "").strip() or None
    return record_page_view(
        db_path=_db_path(),
        path=path,
        request=request,
        web_username=username,
        referrer=str(referrer)[:500] if referrer else None,
        utm_source=body.utm_source,
        utm_medium=body.utm_medium,
        utm_campaign=body.utm_campaign,
    )


@router.get("/traffic")
def analytics_traffic(
    days: int = Query(30, ge=1, le=90),
    _user: dict = Depends(require_admin),
) -> dict:
    """Rapport fréquentation — admin uniquement."""
    return to_jsonable(build_traffic_report(db_path=_db_path(), days=days))
