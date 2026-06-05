from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from api.bridge import bootstrap_bettinghud
from api.auth_tokens import auth_required
from api.routes.auth import current_user
from api.serialize import to_jsonable

router = APIRouter(prefix="/bets", tags=["bets"])


class BetCreate(BaseModel):
    match_name: str
    bet_on: str
    odds: float = Field(gt=1.0)
    stake: float = Field(gt=0.0)
    match_date: str | None = None
    tour: str | None = None
    surface: str | None = None
    tournament: str | None = None
    p_model: float | None = None
    ev_at_bet: float | None = None
    tracker_source: str = "live_tracker_web"
    notes: str | None = None


@router.post("")
def create_bet(body: BetCreate, user: dict | None = Depends(current_user)) -> dict:
    if auth_required() and not user:
        raise HTTPException(status_code=401, detail="Authentification requise")
    bootstrap_bettinghud()
    from scripts.bets_db import save_bet_enriched

    tg = str((user or {}).get("telegram_user_id") or "").strip() or None
    bet_id = save_bet_enriched(
        match_name=body.match_name,
        bet_on=body.bet_on,
        odds=body.odds,
        stake=body.stake,
        match_date=body.match_date,
        tour=body.tour,
        surface=body.surface,
        tournament=body.tournament,
        p_model=body.p_model,
        ev_at_bet=body.ev_at_bet,
        tracker_source=body.tracker_source,
        notes=body.notes,
        telegram_user_id=tg,
    )
    return {"ok": True, "bet_id": bet_id, "bet": to_jsonable(body.model_dump())}
