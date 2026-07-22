"""Replay web : aujourd'hui = live hybride uniquement (pas archive DB intraday)."""
from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import patch

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BH = os.path.normpath(os.path.join(ROOT, "..", "BettingHUD"))
if os.path.isdir(BH) and BH not in sys.path:
    sys.path.insert(0, BH)

from api.services.one_day_one_pick import build_one_day_one_pick_replay
from api.services.top5_replay import build_top5_replay


class ReplayTodayLiveOnlyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.today = "2099-01-15"
        self.db_archive_today = {
            "calendar_date": self.today,
            "tour": "ATP",
            "rank": 3,
            "fav_player": "Archive V.",
            "underdog_player": "Other A.",
            "match_name": "Archive V. vs Other A.",
            "tournament": "Wimbledon",
            "p_model_fav": 0.789,
            "ev_fav_pct": 23.1,
            "odd_fav": 1.55,
            "data_reliability_score": 100,
            "status": "En cours",
        }
        self.live_today = {
            "calendar_date": self.today,
            "tour": "ATP",
            "rank": 1,
            "fav_player": "Live D.",
            "underdog_player": "Other B.",
            "match_name": "Live D. vs Other B.",
            "tournament": "Estoril",
            "p_model_fav": 0.852,
            "ev_fav_pct": 31.3,
            "odd_fav": 1.54,
            "data_reliability_score": 80,
            "theoretical_stake_frac": 0.087,
            "status": "En cours",
            "source": "live",
            "selection_mode": "hybrid_best",
        }
        self.live_top5 = [
            dict(self.live_today),
            {
                **self.live_today,
                "fav_player": "Live H.",
                "underdog_player": "Other C.",
                "match_name": "Live H. vs Other C.",
                "rank": 2,
            },
        ]

    @patch("api.services.one_day_one_pick.datetime")
    @patch("api.services.one_day_one_pick._resolve_today_pick")
    @patch("api.services.one_day_one_pick._select_one_pick_per_day")
    @patch("api.services.one_day_one_pick._load_ranked_rows")
    def test_1d1p_today_uses_live_not_db_archive(
        self,
        load_rows,
        select_hist,
        resolve_today,
        mock_dt,
    ) -> None:
        mock_dt.now.return_value.date.return_value.isoformat.return_value = self.today
        load_rows.return_value = [self.db_archive_today]
        select_hist.return_value = []
        resolve_today.return_value = (dict(self.live_today), "live")

        out = build_one_day_one_pick_replay(db_path=":memory:")

        select_hist.assert_called_once()
        self.assertEqual(select_hist.call_args.kwargs["exclude_date"], self.today)
        self.assertIsNotNone(out["pick_today"])
        self.assertEqual(out["pick_today"]["fav_player"], "Live D.")
        self.assertEqual(out["pick_today"]["source"], "live")
        today_rows = [p for p in out["picks"] if p.get("is_today")]
        self.assertEqual(len(today_rows), 1)
        self.assertEqual(today_rows[0]["fav_player"], "Live D.")

    @patch("api.services.top5_replay.datetime")
    @patch("api.services.top5_replay._resolve_today_picks")
    @patch("api.services.top5_replay._select_top5_per_day")
    @patch("api.services.top5_replay._load_ranked_rows")
    def test_top5_today_uses_live_not_db_archive(
        self,
        load_rows,
        select_hist,
        resolve_today,
        mock_dt,
    ) -> None:
        mock_dt.now.return_value.date.return_value.isoformat.return_value = self.today
        load_rows.return_value = [self.db_archive_today]
        select_hist.return_value = []
        resolve_today.return_value = (list(self.live_top5), self.today)

        out = build_top5_replay(db_path=":memory:")

        select_hist.assert_called_once()
        self.assertEqual(select_hist.call_args.kwargs["exclude_date"], self.today)
        self.assertEqual(len(out["picks_today"]), 2)
        self.assertEqual(out["picks_today"][0]["fav_player"], "Live D.")
        self.assertEqual(out["picks_today"][1]["fav_player"], "Live H.")


if __name__ == "__main__":
    unittest.main()
