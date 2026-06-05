"""Convertit les dicts match/pick en JSON sûr."""
from __future__ import annotations

import math
from typing import Any


def _json_value(v: Any) -> Any:
    if v is None or isinstance(v, (bool, str, int)):
        return v
    if isinstance(v, float):
        if math.isnan(v) or math.isinf(v):
            return None
        return v
    if isinstance(v, dict):
        return {str(k): _json_value(val) for k, val in v.items()}
    if isinstance(v, (list, tuple)):
        return [_json_value(x) for x in v]
    return str(v)


def to_jsonable(obj: Any) -> Any:
    return _json_value(obj)
