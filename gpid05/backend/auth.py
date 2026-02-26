from fastapi import  APIRouter, Depends, HTTPException, Request, Response, Cookie
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import os

import sessions
from security import hash_password, verify_password
from password_policy import validate_password_complexity
from userModels import User
from resetTokenModels import PasswordResetToken
from db import get_db
from audit import log_audit_event

router = APIRouter(prefix="/auth", tags=["auth"])

SESSION_COOKIE = "session_token"
TOKEN_EXPIRY_MINUTES = 30
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# uses the pydantic "BaseModel" to define and validate expected request body
class RegisterBody(BaseModel):
    email: str
    password: str
    role: str

class LoginBody(BaseModel):
    email: str
    password: str

class ForgotPasswordBody(BaseModel):
    email: str

class ResetPasswordBody(BaseModel):
    token: str
    new_password: str

@router.post("/register")
def register(body: RegisterBody, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    role = body.role.strip().lower()
    password = body.password

    if not email or not password or not role:
        raise HTTPException(status_code=400, detail="Email, password, and role are required")
    
    # checks the complexity to make sure it follows the password policy
    is_valid, errors = validate_password_complexity(password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=errors)

    if role not in ["admin", "user", "sponsor"]:
        raise HTTPException(status_code=400, detail="Role must be 'admin', 'user', or 'sponsor'")
    
    # checks the database to see if a user has already registerd with the same email 
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    pw_bytes = password.encode("utf-8")
    if len(pw_bytes) > 72:
        raise HTTPException(status_code=400, detail="password mustbe 72 bytes or less")

    user = User(email=email, role=role, password_hash=hash_password(password))

    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User registered successfully"}

@router.post("/login")
def login(body: LoginBody, request: Request, response: Response, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    password = body.password

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(password, user.password_hash) or not user.is_active:
        log_audit_event(
            db=db,
            event_type="LOGIN_ATTEMPT",
            success=False,
            user_id=user.id if user else None,
            request=request
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    log_audit_event(
        db=db,
        event_type="LOGIN_ATTEMPT",
        success=True,
        user_id=user.id,
        request=request
    )

    token = create_session(db, user.id)

    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False
    )

    return {
    "message": "User logged in successfully",
    "role": user.role,
    "id": user.id
    }



@router.post("/logout")
def logout(
    response: Response, 
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE), 
    db: Session = Depends(get_db)
    ):

    if session_token:
        delete_session(db, session_token)
    
    response.delete_cookie(SESSION_COOKIE)
    
    return {"message": "User logged out successfully"}

# accepts an email and sends a reset link if the account exists
@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordBody, request: Request, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if user:
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False
        ).update({"used": True})
        db.commit()

        raw_token = secrets.token_urlsafe(48)
        expires_at = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRY_MINUTES)

        reset_token = PasswordResetToken(
            user_id=user.id,
            token=raw_token,
            expires_at=expires_at,
        )
        db.add(reset_token)
        db.commit()

        log_audit_event(
            db=db,
            event_type="PASSWORD_RESET_REQUEST",
            success=True,
            user_id=user.id,
            request=request
        )

        reset_link = f"{FRONTEND_URL}/reset-password?token={raw_token}"
        print(f"\nPassword reset link for {email}:\n  {reset_link}\n")

    return {"message": "If an account with that email exists, a reset link has been sent."}


# checks if a reset token is still valid before showing the new password form
@router.get("/validate-reset-token")
def validate_reset_token(token: str, db: Session = Depends(get_db)):
    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == token,
        PasswordResetToken.used == False
    ).first()

    if not token_record or datetime.utcnow() > token_record.expires_at:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")

    return {"valid": True}


# validates the token and updates the password
@router.post("/reset-password")
def reset_password(body: ResetPasswordBody, request: Request, db: Session = Depends(get_db)):
    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == body.token,
        PasswordResetToken.used == False
    ).first()

    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")

    if datetime.utcnow() > token_record.expires_at:
        token_record.used = True
        db.commit()
        log_audit_event(
            db=db,
            event_type="PASSWORD_RESET_EXPIRED",
            success=False,
            user_id=token_record.user_id,
            request=request
        )

        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")

    is_valid, errors = validate_password_complexity(body.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=errors)

    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.password_hash = hash_password(body.new_password)
    token_record.used = True

    db.commit()

    log_audit_event(
        db=db,
        event_type="PASSWORD_RESET_COMPLETE",
        success=True,
        user_id=user.id,
        request=request
    )

    return {"message": "Password updated successfully. You can now log in."}


# returns current logged-in user info based on their session cookie
@router.get("/me")
def get_me(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
    db: Session = Depends(get_db)
):
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = get_session_and_refresh(db, session_token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user = db.query(User).filter(User.id == session.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return {"id": user.id, "email": user.email, "role": user.role}

#deactivates a user account
@router.post("/deactivate-user")
def deactivate_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if not user.is_active:
        raise HTTPException(status_code=400, detail="User is already deactivated.")

    user.is_active = False
    db.commit()

    log_audit_event(
        db=db,
        event_type="USER_DEACTIVATED",
        success=True,
        user_id=user.id,
        request=request
    )

    return {"message": f"User {user.email} has been deactivated."}


#reactivates a user account
@router.post("/reactivate-user")
def reactivate_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.is_active:
        raise HTTPException(status_code=400, detail="User is already active.")

    user.is_active = True
    db.commit()

    log_audit_event(
        db=db,
        event_type="USER_REACTIVATED",
        success=True,
        user_id=user.id,
        request=request
    )

    return {"message": f"User {user.email} has been reactivated."}

@router.get("/users/sponsors")
def get_sponsors(db: Session = Depends(get_db)):
    sponsors = db.query(User).filter(User.role == "sponsor").all()
    return [{"id": s.id, "email": s.email} for s in sponsors]
