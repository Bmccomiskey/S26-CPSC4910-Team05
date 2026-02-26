import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session as DbSession
from fastapi import Depends, HTTPException, Cookie
from db import get_db

from sessionModels import Session

INACTIVITY_MINUTES = 30

def now():
    return datetime.utcnow()

def create_session(db: DbSession, user_id: int) -> str:
    current_time = now()
    token = secrets.token_hex(32)  # 64 characters

    sess = Session(
        user_id=user_id,
        token=token,
        created_at=current_time,
        last_activity_at=current_time,
        expires_at=current_time + timedelta(minutes=INACTIVITY_MINUTES),
    )
    db.add(sess)
    db.commit()
    return token

def delete_session(db: DbSession, token: str) -> None:
    db.query(Session).filter(Session.token == token).delete()
    db.commit()

def get_session_and_refresh(db: DbSession, token: str):
    current_time = now()
    sess = db.query(Session).filter(Session.token == token).first()
    if not sess:
        return None

    # if the session is expired delete it
    if sess.expires_at < current_time:
        db.query(Session).filter(Session.token == token).delete()
        db.commit()
        return None

    # refresh the session
    sess.last_activity_at = current_time
    sess.expires_at = current_time + timedelta(minutes=INACTIVITY_MINUTES)
    db.commit()
    db.refresh(sess)
    return sess

# used to require a valid session for endpoints
# add to an endpoint like "def endpoint(sess = Depends(require_session))" to validate the session
# when the user tries to use that endpoint it will check the inactivity
def require_session(
    db = Depends(get_db),
    session_token: str | None = Cookie(default=None, alias="session_token")
):
    sess = get_session_and_refresh(db, session_token)
    if not sess:
        raise HTTPException(401, detail="Session expired")
    return sess

def require_current_user(
        db = Depends(get_db),
        sess = Depends(require_session)
):
    user = db.query(User).filter(User.id == sess.user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User account unavailable")

    return user

def require_role(*allowed_roles: str):
    def dependency(current_use = Depends(require_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return current_user
    return dependency


