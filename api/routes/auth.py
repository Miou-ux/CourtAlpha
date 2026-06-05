from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from api.auth_tokens import auth_required, issue_token, refresh_token_user, resolve_token, revoke_token
from api.bridge import bootstrap_bettinghud

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class ProfileUpdateRequest(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=80)
    telegram_user_id: str | None = Field(default=None, max_length=32)
    telegram_username: str | None = Field(default=None, max_length=64)
    clear_telegram: bool = False


def _bearer_token(authorization: str | None = Header(default=None)) -> str | None:
    if not authorization:
        return None
    parts = authorization.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip() or None
    return None


def current_user(authorization: str | None = Header(default=None)) -> dict | None:
    return resolve_token(_bearer_token(authorization))


def require_user(authorization: str | None = Header(default=None)) -> dict:
    user = current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentification requise")
    return user


def require_admin(user: dict = Depends(require_user)) -> dict:
    bootstrap_bettinghud()
    from scripts.web_auth import is_admin

    if not is_admin(user):
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    return user


@router.post("/login")
def auth_login(body: LoginRequest) -> dict:
    bootstrap_bettinghud()
    from scripts.web_auth import authenticate

    user = authenticate(body.username.strip(), body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    token = issue_token(user)
    return {"ok": True, "token": token, "user": user}


@router.get("/me")
def auth_me(user: dict | None = Depends(current_user)) -> dict:
    if user:
        return {"ok": True, "authenticated": True, "user": user, "auth_required": auth_required()}
    return {"ok": True, "authenticated": False, "auth_required": auth_required()}


@router.post("/logout")
def auth_logout(authorization: str | None = Header(default=None)) -> dict:
    revoke_token(_bearer_token(authorization))
    return {"ok": True}


@router.patch("/profile")
def auth_update_profile(
    body: ProfileUpdateRequest,
    user: dict = Depends(require_user),
    authorization: str | None = Header(default=None),
) -> dict:
    bootstrap_bettinghud()
    from scripts.web_auth import update_user_profile

    updated = update_user_profile(
        user["username"],
        display_name=body.display_name,
        telegram_user_id=body.telegram_user_id,
        telegram_username=body.telegram_username,
        clear_telegram=body.clear_telegram,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    refresh_token_user(_bearer_token(authorization), updated)
    return {"ok": True, "user": updated}


@router.post("/avatar")
async def auth_upload_avatar(
    file: UploadFile = File(...),
    user: dict = Depends(require_user),
    authorization: str | None = Header(default=None),
) -> dict:
    bootstrap_bettinghud()
    from scripts.web_auth import save_user_avatar, update_user_profile

    content = await file.read()
    try:
        save_user_avatar(user["username"], content, content_type=file.content_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    updated = update_user_profile(user["username"])
    if not updated:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    refresh_token_user(_bearer_token(authorization), updated)
    return {"ok": True, "user": updated}


@router.get("/avatar/{username}")
def auth_get_avatar(username: str) -> FileResponse:
    bootstrap_bettinghud()
    from scripts.web_auth import _avatar_file_for_username

    path = _avatar_file_for_username(username)
    if not path:
        raise HTTPException(status_code=404, detail="Avatar introuvable")
    media = "image/jpeg"
    if path.suffix.lower() == ".png":
        media = "image/png"
    elif path.suffix.lower() == ".webp":
        media = "image/webp"
    return FileResponse(Path(path), media_type=media)
