from __future__ import annotations

from fastapi import APIRouter, Depends

from api.bridge import bootstrap_bettinghud
from api.routes.auth import require_admin
from api.serialize import to_jsonable

router = APIRouter(prefix="/tracking", tags=["tracking"])


@router.get("")
def tracking_summary(_user: dict = Depends(require_admin)) -> dict:
    bootstrap_bettinghud()
    from scripts.bets_db import DB_PATH_DEFAULT
    from scripts.model_tracking import compute_tracking

    data = compute_tracking(DB_PATH_DEFAULT)
    return to_jsonable(data)
