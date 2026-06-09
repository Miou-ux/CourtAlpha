"""Fréquentation web — enregistrement page views + agrégats admin."""
from __future__ import annotations

import hashlib
import ipaddress
import json
import os
import sqlite3
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

PARIS = ZoneInfo("Europe/Paris")
DEFAULT_RETENTION_DAYS = 90
VISITOR_SALT = os.getenv("COURTALPHA_ANALYTICS_SALT", "courtalpha-analytics-v1")
SITE_HOSTS = {"courtalpha.tech", "www.courtalpha.tech", "localhost", "127.0.0.1"}
EXTRA_COLUMNS = (
    ("country_code", "TEXT"),
    ("traffic_source", "TEXT"),
    ("referrer_host", "TEXT"),
    ("utm_source", "TEXT"),
    ("utm_medium", "TEXT"),
    ("utm_campaign", "TEXT"),
)


def _now_paris() -> datetime:
    return datetime.now(PARIS)


def _client_ip(request: Any) -> str:
    xf = request.headers.get("x-forwarded-for") if request else None
    if xf:
        return str(xf).split(",")[0].strip()
    if request and request.client:
        return str(request.client.host or "unknown")
    return "unknown"


def _visitor_key(*, ip: str, user_agent: str) -> str:
    raw = f"{VISITOR_SALT}|{ip}|{(user_agent or '')[:240]}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]


def _is_private_ip(ip: str) -> bool:
    try:
        return ipaddress.ip_address(ip).is_private or ipaddress.ip_address(ip).is_loopback
    except ValueError:
        return True


def _country_from_headers(request: Any) -> str | None:
    if not request:
        return None
    for key in ("cf-ipcountry", "x-country-code", "x-geo-country", "x-appengine-country"):
        raw = request.headers.get(key)
        if not raw:
            continue
        code = str(raw).strip().upper()[:2]
        if len(code) == 2 and code.isalpha() and code != "XX":
            return code
    return None


def _country_from_ip(ip: str) -> str | None:
    if not ip or ip == "unknown" or _is_private_ip(ip):
        return None
    if os.getenv("COURTALPHA_ANALYTICS_GEOIP", "1").strip() in {"0", "false", "no"}:
        return None
    try:
        url = f"http://ip-api.com/json/{urllib.parse.quote(ip)}?fields=countryCode"
        req = urllib.request.Request(url, headers={"User-Agent": "CourtAlpha-Analytics/1.0"})
        with urllib.request.urlopen(req, timeout=1.8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        code = str(data.get("countryCode") or "").strip().upper()[:2]
        return code if len(code) == 2 and code.isalpha() else None
    except Exception:
        return None


def _resolve_country(request: Any) -> str | None:
    return _country_from_headers(request) or _country_from_ip(_client_ip(request))


def _referrer_host(referrer: str | None) -> str | None:
    if not referrer or not str(referrer).strip():
        return None
    try:
        host = urllib.parse.urlparse(str(referrer).strip()).netloc.lower().split(":")[0]
        if host.startswith("www."):
            host = host[4:]
        return host or None
    except Exception:
        return None


def _classify_traffic_source(
    *,
    referrer: str | None,
    utm_source: str | None,
    utm_medium: str | None,
) -> tuple[str, str | None]:
    """Retourne (source_label, referrer_host)."""
    host = _referrer_host(referrer)
    utm = (utm_source or "").strip().lower()
    medium = (utm_medium or "").strip().lower()

    if utm:
        label = utm.replace(" ", "_")[:40]
        if medium:
            label = f"{label} ({medium})"
        return f"utm:{label}", host

    if not host:
        return "direct", None

    if host in SITE_HOSTS:
        return "internal", host

    if "google." in host or host == "google.com":
        return "google", host
    if host in {"bing.com", "www.bing.com"} or host.endswith(".bing.com"):
        return "bing", host
    if host in {"duckduckgo.com", "ddg.co"}:
        return "duckduckgo", host
    if host in {"t.co", "twitter.com", "x.com", "mobile.twitter.com"} or "twitter." in host:
        return "twitter", host
    if "facebook." in host or host in {"fb.com", "l.facebook.com", "lm.facebook.com"}:
        return "facebook", host
    if host in {"t.me", "telegram.me", "telegram.org"}:
        return "telegram", host
    if "instagram." in host:
        return "instagram", host
    if "linkedin." in host:
        return "linkedin", host
    if "reddit." in host:
        return "reddit", host
    if "youtube." in host or host == "youtu.be":
        return "youtube", host

    return f"referral:{host}", host


def _source_label_display(source: str) -> str:
    labels = {
        "direct": "Accès direct",
        "internal": "Navigation interne",
        "google": "Google",
        "bing": "Bing",
        "duckduckgo": "DuckDuckGo",
        "twitter": "Twitter / X",
        "facebook": "Facebook",
        "telegram": "Telegram",
        "instagram": "Instagram",
        "linkedin": "LinkedIn",
        "reddit": "Reddit",
        "youtube": "YouTube",
    }
    if source in labels:
        return labels[source]
    if source.startswith("utm:"):
        return f"UTM · {source[4:]}"
    if source.startswith("referral:"):
        return source[9:]
    return source


def _country_label(code: str | None) -> str:
    if not code:
        return "Inconnu"
    names = {
        "FR": "France",
        "BE": "Belgique",
        "CH": "Suisse",
        "CA": "Canada",
        "US": "États-Unis",
        "GB": "Royaume-Uni",
        "DE": "Allemagne",
        "ES": "Espagne",
        "IT": "Italie",
        "NL": "Pays-Bas",
        "PT": "Portugal",
        "MA": "Maroc",
        "TN": "Tunisie",
        "DZ": "Algérie",
    }
    return names.get(code.upper(), code.upper())


def ensure_web_traffic_schema(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS web_page_views (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            viewed_at TEXT NOT NULL,
            calendar_date TEXT NOT NULL,
            hour_paris INTEGER NOT NULL,
            path TEXT NOT NULL,
            referrer TEXT,
            visitor_key TEXT NOT NULL,
            web_username TEXT,
            is_authenticated INTEGER NOT NULL DEFAULT 0,
            user_agent TEXT
        )
        """
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_web_page_views_cal_date ON web_page_views(calendar_date)"
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_web_page_views_path ON web_page_views(path)")
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_web_page_views_visitor ON web_page_views(visitor_key, viewed_at)"
    )
    existing = {str(r[1]) for r in conn.execute("PRAGMA table_info(web_page_views)")}
    for col, typ in EXTRA_COLUMNS:
        if col not in existing:
            conn.execute(f"ALTER TABLE web_page_views ADD COLUMN {col} {typ}")
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_web_page_views_source ON web_page_views(traffic_source)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_web_page_views_country ON web_page_views(country_code)"
    )
    conn.commit()


def _purge_old_rows(conn: sqlite3.Connection, *, retention_days: int = DEFAULT_RETENTION_DAYS) -> None:
    cutoff = (_now_paris().date() - timedelta(days=max(7, int(retention_days)))).isoformat()
    conn.execute("DELETE FROM web_page_views WHERE calendar_date < ?", (cutoff,))
    conn.commit()


def record_page_view(
    *,
    db_path: str,
    path: str,
    request: Any,
    web_username: str | None = None,
    referrer: str | None = None,
    utm_source: str | None = None,
    utm_medium: str | None = None,
    utm_campaign: str | None = None,
) -> dict[str, Any]:
    """Enregistre une vue (déduplique 30 s même visiteur + path)."""
    clean_path = str(path or "/").strip()
    if not clean_path.startswith("/"):
        clean_path = f"/{clean_path}"
    if clean_path.startswith("/api/"):
        return {"ok": True, "recorded": False, "reason": "api_path_skipped"}

    now = _now_paris()
    viewed_at = now.isoformat(timespec="seconds")
    cal = now.date().isoformat()
    hour = now.hour
    ua = (request.headers.get("user-agent") if request else None) or ""
    vkey = _visitor_key(ip=_client_ip(request), user_agent=ua)
    auth_user = (web_username or "").strip() or None
    country = _resolve_country(request)
    traffic_source, ref_host = _classify_traffic_source(
        referrer=referrer,
        utm_source=utm_source,
        utm_medium=utm_medium,
    )
    utm_src = (utm_source or "").strip()[:80] or None
    utm_med = (utm_medium or "").strip()[:80] or None
    utm_camp = (utm_campaign or "").strip()[:120] or None

    conn = sqlite3.connect(db_path)
    try:
        ensure_web_traffic_schema(conn)
        cutoff = (now - timedelta(seconds=30)).isoformat(timespec="seconds")
        dup = conn.execute(
            """
            SELECT 1 FROM web_page_views
            WHERE visitor_key = ? AND path = ? AND viewed_at >= ?
            LIMIT 1
            """,
            (vkey, clean_path, cutoff),
        ).fetchone()
        if dup:
            return {"ok": True, "recorded": False, "reason": "deduped"}

        conn.execute(
            """
            INSERT INTO web_page_views (
                viewed_at, calendar_date, hour_paris, path, referrer,
                visitor_key, web_username, is_authenticated, user_agent,
                country_code, traffic_source, referrer_host,
                utm_source, utm_medium, utm_campaign
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                viewed_at,
                cal,
                hour,
                clean_path,
                (referrer or "")[:500] or None,
                vkey,
                auth_user,
                1 if auth_user else 0,
                ua[:300] or None,
                country,
                traffic_source,
                ref_host,
                utm_src,
                utm_med,
                utm_camp,
            ),
        )
        conn.commit()
        _purge_old_rows(conn)
        return {"ok": True, "recorded": True}
    finally:
        conn.close()


def _path_label(path: str) -> str:
    labels = {
        "/live": "Live Tracker",
        "/paris": "Paris du jour",
        "/top5": "Top 5",
        "/1-day-1-pick": "1 Day 1 Pick",
        "/methodo": "Methodo",
        "/pricing": "Tarifs",
        "/top-probas": "Top probas",
        "/portfolio": "Portefeuille",
        "/login": "Connexion",
        "/profile": "Profil",
        "/backtest": "Backtest",
        "/tracking": "Tracking modèle",
        "/frequentation": "Fréquentation",
        "/settings": "Paramètres",
    }
    return labels.get(path, path)


def build_traffic_report(*, db_path: str, days: int = 30) -> dict[str, Any]:
    days = max(1, min(90, int(days)))
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        ensure_web_traffic_schema(conn)
        today = _now_paris().date()
        start = (today - timedelta(days=days - 1)).isoformat()
        today_s = today.isoformat()
        yesterday_s = (today - timedelta(days=1)).isoformat()
        week_start = (today - timedelta(days=6)).isoformat()

        def _count(sql: str, params: tuple = ()) -> int:
            row = conn.execute(sql, params).fetchone()
            return int(row[0] if row else 0)

        views_today = _count(
            "SELECT COUNT(*) FROM web_page_views WHERE calendar_date = ?", (today_s,)
        )
        views_yesterday = _count(
            "SELECT COUNT(*) FROM web_page_views WHERE calendar_date = ?", (yesterday_s,)
        )
        unique_today = _count(
            "SELECT COUNT(DISTINCT visitor_key) FROM web_page_views WHERE calendar_date = ?",
            (today_s,),
        )
        views_7d = _count(
            "SELECT COUNT(*) FROM web_page_views WHERE calendar_date >= ?", (week_start,)
        )
        unique_7d = _count(
            "SELECT COUNT(DISTINCT visitor_key) FROM web_page_views WHERE calendar_date >= ?",
            (week_start,),
        )
        views_period = _count(
            "SELECT COUNT(*) FROM web_page_views WHERE calendar_date >= ?", (start,)
        )
        unique_period = _count(
            "SELECT COUNT(DISTINCT visitor_key) FROM web_page_views WHERE calendar_date >= ?",
            (start,),
        )
        auth_views = _count(
            "SELECT COUNT(*) FROM web_page_views WHERE calendar_date >= ? AND is_authenticated = 1",
            (start,),
        )
        auth_share = (auth_views / views_period * 100.0) if views_period else 0.0

        daily_rows = conn.execute(
            """
            SELECT calendar_date AS date,
                   COUNT(*) AS views,
                   COUNT(DISTINCT visitor_key) AS uniques,
                   SUM(CASE WHEN is_authenticated = 1 THEN 1 ELSE 0 END) AS authenticated_views
            FROM web_page_views
            WHERE calendar_date >= ?
            GROUP BY calendar_date
            ORDER BY calendar_date ASC
            """,
            (start,),
        ).fetchall()

        daily_map = {str(r["date"]): dict(r) for r in daily_rows}
        daily: list[dict[str, Any]] = []
        for i in range(days):
            d = (today - timedelta(days=days - 1 - i)).isoformat()
            row = daily_map.get(d)
            daily.append(
                {
                    "date": d,
                    "views": int(row["views"]) if row else 0,
                    "uniques": int(row["uniques"]) if row else 0,
                    "authenticated_views": int(row["authenticated_views"]) if row else 0,
                }
            )

        top_pages_rows = conn.execute(
            """
            SELECT path,
                   COUNT(*) AS views,
                   COUNT(DISTINCT visitor_key) AS uniques
            FROM web_page_views
            WHERE calendar_date >= ?
            GROUP BY path
            ORDER BY views DESC
            LIMIT 15
            """,
            (start,),
        ).fetchall()
        top_pages = [
            {
                "path": str(r["path"]),
                "label": _path_label(str(r["path"])),
                "views": int(r["views"]),
                "uniques": int(r["uniques"]),
                "share_pct": round(int(r["views"]) / views_period * 100.0, 1) if views_period else 0.0,
            }
            for r in top_pages_rows
        ]

        hourly_rows = conn.execute(
            """
            SELECT hour_paris AS hour, COUNT(*) AS views
            FROM web_page_views
            WHERE calendar_date = ?
            GROUP BY hour_paris
            ORDER BY hour_paris ASC
            """,
            (today_s,),
        ).fetchall()
        hourly_map = {int(r["hour"]): int(r["views"]) for r in hourly_rows}
        hourly_today = [{"hour": h, "views": hourly_map.get(h, 0)} for h in range(24)]

        source_rows = conn.execute(
            """
            SELECT COALESCE(traffic_source, 'direct') AS source,
                   COUNT(*) AS views,
                   COUNT(DISTINCT visitor_key) AS uniques
            FROM web_page_views
            WHERE calendar_date >= ?
            GROUP BY source
            ORDER BY views DESC
            LIMIT 20
            """,
            (start,),
        ).fetchall()
        top_sources = [
            {
                "source": str(r["source"]),
                "label": _source_label_display(str(r["source"])),
                "views": int(r["views"]),
                "uniques": int(r["uniques"]),
                "share_pct": round(int(r["views"]) / views_period * 100.0, 1) if views_period else 0.0,
            }
            for r in source_rows
        ]

        country_rows = conn.execute(
            """
            SELECT COALESCE(country_code, '') AS country_code,
                   COUNT(*) AS views,
                   COUNT(DISTINCT visitor_key) AS uniques
            FROM web_page_views
            WHERE calendar_date >= ?
            GROUP BY country_code
            ORDER BY views DESC
            LIMIT 20
            """,
            (start,),
        ).fetchall()
        top_countries = [
            {
                "country_code": str(r["country_code"]) or None,
                "label": _country_label(str(r["country_code"]) if r["country_code"] else None),
                "views": int(r["views"]),
                "uniques": int(r["uniques"]),
                "share_pct": round(int(r["views"]) / views_period * 100.0, 1) if views_period else 0.0,
            }
            for r in country_rows
        ]

        referrer_rows = conn.execute(
            """
            SELECT COALESCE(referrer_host, '') AS host,
                   COUNT(*) AS views
            FROM web_page_views
            WHERE calendar_date >= ? AND referrer_host IS NOT NULL AND referrer_host != ''
            GROUP BY referrer_host
            ORDER BY views DESC
            LIMIT 15
            """,
            (start,),
        ).fetchall()
        top_referrers = [
            {
                "host": str(r["host"]),
                "views": int(r["views"]),
                "share_pct": round(int(r["views"]) / views_period * 100.0, 1) if views_period else 0.0,
            }
            for r in referrer_rows
        ]

        first_row = conn.execute(
            "SELECT MIN(calendar_date) AS d FROM web_page_views"
        ).fetchone()
        data_since = str(first_row["d"]) if first_row and first_row["d"] else None

        return {
            "period_days": days,
            "timezone": "Europe/Paris",
            "data_since": data_since,
            "summary": {
                "views_today": views_today,
                "views_yesterday": views_yesterday,
                "unique_today": unique_today,
                "views_7d": views_7d,
                "unique_7d": unique_7d,
                "views_period": views_period,
                "unique_period": unique_period,
                "authenticated_share_pct": round(auth_share, 1),
            },
            "daily": daily,
            "top_pages": top_pages,
            "top_sources": top_sources,
            "top_countries": top_countries,
            "top_referrers": top_referrers,
            "hourly_today": hourly_today,
            "generated_at": _now_paris().isoformat(timespec="seconds"),
        }
    finally:
        conn.close()
