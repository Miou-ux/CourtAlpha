from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from api.bridge import bootstrap_bettinghud
from api.routes.auth import require_admin
from api.config import bettinghud_root
from api.serialize import to_jsonable

router = APIRouter(prefix="/backtest", tags=["backtest"])


class BacktestSimulateRequest(BaseModel):
    year: int = Field(..., ge=2010, le=2035)
    bankroll_start: float = Field(1000.0, gt=0)
    kelly_multiplier: float = Field(0.5, ge=0, le=2)
    max_stake_pct: float = Field(5.0, ge=0.1, le=100)
    daily_stake_budget_pct: float = Field(100.0, ge=1, le=100)
    ev_min_pct: float | None = Field(None, ge=0, le=100)
    use_fixed_stake_pct: bool = False
    fixed_stake_pct: float = Field(1.0, ge=0, le=100)
    use_adaptive_kelly: bool = False
    adaptive_kelly_base_fraction: float = Field(0.5, ge=0, le=1)


def _serialize_history(history: list[dict]) -> list[dict]:
    out: list[dict] = []
    for h in history:
        row = dict(h)
        ts = row.get("date")
        if ts is not None and hasattr(ts, "isoformat"):
            row["date"] = ts.date().isoformat() if hasattr(ts, "date") else str(ts)
        out.append(row)
    return out


@router.get("/years")
def backtest_years(_user: dict = Depends(require_admin)) -> dict:
    bootstrap_bettinghud()
    from scripts.backtest_staking_sim import list_backtest_years_with_valid_csv

    root = str(bettinghud_root())
    years = list_backtest_years_with_valid_csv(root)
    return {"years": years, "count": len(years)}


@router.post("/simulate")
def backtest_simulate(body: BacktestSimulateRequest, _user: dict = Depends(require_admin)) -> dict:
    bootstrap_bettinghud()
    from scripts.backtest_staking_sim import (
        load_and_filter_bets_csv,
        resolve_backtest_csv,
        simulate_sequential_intraday,
    )

    root = str(bettinghud_root())
    csv_path = resolve_backtest_csv(root, body.year)
    if not csv_path:
        raise HTTPException(status_code=404, detail=f"Aucun CSV backtest pour {body.year}")

    try:
        df = load_and_filter_bets_csv(
            csv_path,
            year=body.year,
            ev_min_pct=body.ev_min_pct,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if df.empty:
        raise HTTPException(status_code=404, detail="Aucun pari après filtres")

    seg_brier: dict[str, float] = {}
    global_brier = 0.12

    res: dict[str, Any] = simulate_sequential_intraday(
        df,
        bankroll_start=float(body.bankroll_start),
        kelly_multiplier=float(body.kelly_multiplier),
        max_stake_pct=float(body.max_stake_pct),
        daily_stake_budget_pct=float(body.daily_stake_budget_pct),
        use_fixed_stake_pct=bool(body.use_fixed_stake_pct),
        fixed_stake_pct=float(body.fixed_stake_pct),
        use_adaptive_kelly_quarter=bool(body.use_adaptive_kelly),
        adaptive_kelly_base_fraction=float(body.adaptive_kelly_base_fraction),
        segment_brier_scores=seg_brier,
        global_brier_score=global_brier,
        return_history=True,
    )
    history = _serialize_history(list(res.pop("history", []) or []))
    daily_pnls = list(res.pop("daily_pnls", []) or [])

    return to_jsonable(
        {
            "year": body.year,
            "csv_path": csv_path,
            "n_bets_input": int(len(df)),
            "summary": res,
            "history": history,
            "daily_pnls": daily_pnls,
        }
    )
