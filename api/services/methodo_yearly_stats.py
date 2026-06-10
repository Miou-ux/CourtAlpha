"""Public yearly backtest stats for /methodo (Top 5 + 1D1P ROI)."""
from __future__ import annotations

from typing import Any


def build_methodo_yearly_stats(*, years: list[int] | None = None) -> dict[str, Any]:
    from scripts.methodo_yearly_stats import build_methodo_yearly_stats as _build

    return _build(years=years)
