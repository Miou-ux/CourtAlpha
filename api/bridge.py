"""Branche CourtAlpha sur le code et les données du projet BettingHUD."""
from __future__ import annotations

import os
import sys
from pathlib import Path

from api.config import bettinghud_root

_bootstrapped = False


def bootstrap_bettinghud() -> Path:
    """Ajoute BettingHUD au PYTHONPATH et positionne le cwd (idempotent)."""
    global _bootstrapped
    root = bettinghud_root()
    if not root.is_dir():
        raise FileNotFoundError(
            f"BETTINGHUD_ROOT introuvable : {root}. "
            "Copie .env.example vers .env et ajuste le chemin."
        )
    os.environ.setdefault("BETTINGHUD_ENV", "preprod")
    os.environ.setdefault("BETTINGHUD_HEADLESS", "1")
    os.chdir(root)
    root_str = str(root)
    if root_str not in sys.path:
        sys.path.insert(0, root_str)
    _bootstrapped = True
    return root
