"""Top probas jour — logique alignée dashboard (sans Streamlit)."""
from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

PARIS = ZoneInfo("Europe/Paris")
TOP_PROBAS_DISPLAY_LIMIT = 15
FAVORITE_EV_BAND_MIN_FRAC = 0.15
FAVORITE_EV_BAND_MAX_FRAC = 1.0


def match_favorite_model_metrics(m: dict) -> dict | None:
    try:
        if float(m.get("odd_p1") or 0.0) <= 1.0 or float(m.get("odd_p2") or 0.0) <= 1.0:
            return None
    except (TypeError, ValueError):
        return None
    fs = m.get("feature_snapshot") or {}
    try:
        p1 = float(fs.get("capped_p1_prob") or 0.5)
    except (TypeError, ValueError):
        p1 = 0.5
    fav_side = 1 if p1 >= 0.5 else 2
    fav_p = max(p1, 1.0 - p1)
    fav = str(m.get("player1") if fav_side == 1 else m.get("player2") or "")
    und = str(m.get("player2") if fav_side == 1 else m.get("player1") or "")
    of = m.get("odd_p1") if fav_side == 1 else m.get("odd_p2")
    ou = m.get("odd_p2") if fav_side == 1 else m.get("odd_p1")
    try:
        cotes = f"{float(of):.2f} / {float(ou):.2f}"
        book_implied = 100.0 / float(of) if of else None
        ev_fav_frac = fav_p * float(of) - 1.0
    except (TypeError, ValueError):
        cotes = "—"
        book_implied = None
        ev_fav_frac = None
    gap = m.get("book_gap_pp")
    try:
        gap_f = float(gap) if gap is not None else None
        gap_s = f"{gap_f:.1f}" if gap_f is not None else "—"
    except (TypeError, ValueError):
        gap_f = None
        gap_s = "—"
    return {
        "fav_p": fav_p,
        "p1": p1,
        "fav_side": fav_side,
        "odd_fav": float(of) if of is not None else None,
        "odd_und": float(ou) if ou is not None else None,
        "ev_fav_frac": ev_fav_frac,
        "ev_fav_pct": (float(ev_fav_frac) * 100.0) if ev_fav_frac is not None else None,
        "fav": fav,
        "und": und,
        "tour": str(m.get("tour") or "").upper(),
        "tournament": str(m.get("tournament") or "")[:40],
        "cotes": cotes,
        "gap_pp": gap_f,
        "gap_s": gap_s,
        "book_implied_pct": book_implied,
        "favori_label": fav.split("(")[0].strip(),
    }


def _passes_favorite_ev_band(
    metrics: dict | None,
    *,
    ev_min_frac: float | None,
    ev_max_frac: float | None,
) -> bool:
    if metrics is None:
        return False
    ev_fav_frac = metrics.get("ev_fav_frac")
    if ev_fav_frac is None:
        return False
    if ev_min_frac is not None and float(ev_fav_frac) < float(ev_min_frac):
        return False
    if ev_max_frac is not None and float(ev_fav_frac) > float(ev_max_frac):
        return False
    return True


def _is_today_calendar_match(m: dict) -> bool:
    from scripts.daily_top_proba_store import _match_calendar_date

    d = _match_calendar_date(m)
    if d is not None:
        return d == datetime.now(PARIS).date()
    return not str(m.get("time") or "").startswith("Demain")


def filter_matches_scope(matches: list[dict], *, include_challengers: bool) -> list[dict]:
    from scripts.tournament_tier import is_challenger_tier_match, is_major_tournament_match

    out: list[dict] = []
    for m in matches:
        if include_challengers:
            if is_major_tournament_match(m) or is_challenger_tier_match(m):
                out.append(m)
        elif is_major_tournament_match(m):
            out.append(m)
    return out


def collect_top_probas_rows(
    matches: list[dict],
    *,
    limit: int = TOP_PROBAS_DISPLAY_LIMIT,
    ev_min_frac: float | None = None,
    ev_max_frac: float | None = None,
    today_only: bool = True,
) -> list[dict]:
    rows: list[dict] = []
    for m in matches:
        if today_only and not _is_today_calendar_match(m):
            continue
        met = match_favorite_model_metrics(m)
        if not _passes_favorite_ev_band(met, ev_min_frac=ev_min_frac, ev_max_frac=ev_max_frac):
            continue
        rows.append(dict(met))
    rows.sort(key=lambda r: -float(r["fav_p"]))
    return rows[: max(0, int(limit))]


def rows_to_chart(rows: list[dict]) -> list[dict]:
    chart: list[dict] = []
    for i, r in enumerate(rows, start=1):
        chart.append(
            {
                "rank": i,
                "favori": r["favori_label"],
                "adversaire": r["und"].split("(")[0].strip(),
                "tour": r["tour"] or "—",
                "tournament": r["tournament"],
                "proba_model_pct": round(float(r["fav_p"]) * 100.0, 1),
                "proba_book_pct": r.get("book_implied_pct"),
                "ev_fav_pct": r.get("ev_fav_pct"),
                "gap_pp": r.get("gap_pp"),
            }
        )
    return chart


def rows_to_table(rows: list[dict]) -> list[dict]:
    table: list[dict] = []
    for i, r in enumerate(rows, start=1):
        table.append(
            {
                "rank": i,
                "proba_fav_pct": round(float(r["fav_p"]) * 100.0, 1),
                "p1_pct": round(float(r["p1"]) * 100.0, 1),
                "tour": r["tour"],
                "favori": r["fav"],
                "adversaire": r["und"],
                "tournament": r["tournament"],
                "cotes": r["cotes"],
                "ev_fav_pct": r.get("ev_fav_pct"),
                "gap_pp": r.get("gap_pp"),
                "gap_warn": bool(r.get("gap_pp") is not None and float(r["gap_pp"]) >= 25.0),
            }
        )
    return table
