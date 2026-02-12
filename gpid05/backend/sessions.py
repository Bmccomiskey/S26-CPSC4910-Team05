import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session as DbSession

from sessionModels import Session

INACTIVITY_MINUTES = 30

def now():
    return datetime.utcnow()

def create_session(db: DbSession, user_id: int) -> str:
    now = now()
    token = secrets.token_hex(32)  # 64 characters

    sess = Session(
        user_id=user_id,
        token=token,
        created_at=now,
        last_activity_at=now,
        expires_at=now + timedelta(minutes=INACTIVITY_MINUTES),
    )
    db.add(sess)
    db.commit()
    return token

def delete_session(db: DbSession, token: str) -> None:
    db.query(Session).filter(Session.token == token).delete()
    db.commit()

def get_session_and_refresh(db: DbSession, token: str):
    now = now()
    sess = db.query(Session).filter(Session.token == token).first()
    if not sess:
        return None

    # if the session is expired delete it
    if sess.expires_at < now:
        db.query(Session).filter(Session.token == token).delete()
        db.commit()
        return None

    # refresh the session
    sess.last_activity_at = now
    sess.expires_at = now + timedelta(minutes=INACTIVITY_MINUTES)
    db.commit()
    db.refresh(sess)
    return sess
