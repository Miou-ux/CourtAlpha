"""CourtAlpha API — PREPROD, lecture seule sur le moteur BettingHUD/."""
from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.config import cors_origins
from api.routes import analytics, auth, backtest, bets, billing, health, live, picks, portfolio, system, top_probas, tracking

WEB_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(WEB_ROOT / ".env")
load_dotenv(WEB_ROOT / ".env.example")

app = FastAPI(
    title="CourtAlpha API",
    description="API PREPROD CourtAlpha — consomme scripts/ et data/ de BettingHUD sans modifier Streamlit.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(live.router, prefix="/api")
app.include_router(picks.router, prefix="/api")
app.include_router(portfolio.router, prefix="/api")
app.include_router(bets.router, prefix="/api")
app.include_router(top_probas.router, prefix="/api")
app.include_router(backtest.router, prefix="/api")
app.include_router(tracking.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(billing.router, prefix="/api")
app.include_router(system.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
