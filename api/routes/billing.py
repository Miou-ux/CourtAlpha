from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from api.bridge import bootstrap_bettinghud
from api.routes.auth import require_user
from api.serialize import to_jsonable

router = APIRouter(prefix="/billing", tags=["billing"])


class CreateOrderRequest(BaseModel):
    plan_id: str = Field(default="premium_30d", min_length=1)


@router.get("/config")
def billing_config() -> dict:
    bootstrap_bettinghud()
    from scripts.web_billing import billing_enabled, billing_public_config

    return to_jsonable({"ok": True, "enabled": billing_enabled(), **billing_public_config()})


@router.get("/plans")
def billing_plans() -> dict:
    bootstrap_bettinghud()
    from scripts.web_billing import billing_enabled, billing_public_config, list_active_plans

    return to_jsonable(
        {
            "ok": True,
            "enabled": billing_enabled(),
            "plans": list_active_plans(),
            **billing_public_config(),
        }
    )


@router.get("/me")
def billing_me(user: dict = Depends(require_user)) -> dict:
    bootstrap_bettinghud()
    from scripts.web_billing import get_premium_until, is_premium, user_tier

    return to_jsonable(
        {
            "ok": True,
            "tier": user_tier(user),
            "premium_active": is_premium(user.get("username"), user=user),
            "premium_until": get_premium_until(str(user.get("username") or "")),
        }
    )


@router.post("/orders")
def billing_create_order(
    body: CreateOrderRequest,
    user: dict = Depends(require_user),
) -> dict:
    bootstrap_bettinghud()
    from scripts.web_billing import create_order

    try:
        order = create_order(str(user.get("username") or ""), body.plan_id.strip())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return to_jsonable({"ok": True, "order": order})


@router.get("/orders/{order_id}")
def billing_get_order(order_id: str, user: dict = Depends(require_user)) -> dict:
    bootstrap_bettinghud()
    from scripts.web_billing import get_order

    order = get_order(order_id, username=str(user.get("username") or ""))
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return to_jsonable({"ok": True, "order": order})
