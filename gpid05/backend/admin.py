from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from db import get_db
from userModels import User
from audit import log_audit_event
from sessions import require_role

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
def admin_list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    users = db.query(User).order_by(User.id.asc()).all()

    return [
        {
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active
        }
        for u in users
    ]


@router.post("/users/{user_id}/lock")
def lock_user_account(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot lock your own account.")

    if not user.is_active:
        raise HTTPException(status_code=400, detail="User is already locked.")

    user.is_active = False
    db.commit()

    log_audit_event(
        db=db,
        event_type="USER_DEACTIVATED",
        success=True,
        user_id=current_user.id,
        request=request,
        metadata={"target_user_id": user.id, "target_email": user.email}
    )

    return {"message": f"User {user.email} has been locked."}


@router.post("/users/{user_id}/unlock")
def unlock_user_account(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
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
        user_id=current_user.id,
        request=request,
        metadata={"target_user_id": user.id, "target_email": user.email}
    )

    return {"message": f"User {user.email} has been unlocked."}