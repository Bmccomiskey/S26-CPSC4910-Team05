from fastapi import  APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from password_policy import validate_password_complexity
from userModels import User
from db import get_db
from audit import log_audit_event

router = APIRouter(prefix="/auth", tags=["auth"])

# uses the pydantic "BaseModel" to define and validate expected request body
class RegisterBody(BaseModel):
    email: str
    password: str
    role: str

class LoginBody(BaseModel):
    email: str
    password: str

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

    # will be updated to encryption later
    user = User(email=email, role=role, password_hash=password)

    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User registered successfully"}

@router.post("/login")
def login(body: LoginBody, request: Request, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    password = body.password

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    user = db.query(User).filter(User.email == email).first()

    if not user or user.password_hash != password:
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

    return {"message": "User logged in successfully"}


@router.post("/logout")
def logout():
    # when session handling is implemented this will invalidate the token and remove their session
    return {"message": "User logged out successfully"}