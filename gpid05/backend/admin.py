from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from db import get_db
from userModels import User
from audit import log_audit_event
from sessions import require_role, require_admin_user, require_session, require_original_user
from pydantic import BaseModel
from security import hash_password

router = APIRouter(prefix="/admin", tags=["admin"])

class AdminCreateUserBody(BaseModel):
    email: str
    password: str
    role: str

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

@router.post("/users")
def admin_create_user(
    body: AdminCreateUserBody,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    role = body.role.lower().strip()
    if role not in {"user", "sponsor", "admin"}:
        raise HTTPException(status_code=400, detail="Invalid role. Must be user, sponsor, or admin.")

    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with that email already exists.")

    pw_len = len(body.password.encode("utf-8"))
    if pw_len == 0:
        raise HTTPException(status_code=400, detail="Password is required.")

    new_user = User(
        email=body.email,
        role=role,
        password_hash=hash_password(body.password),
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit_event(
        db=db,
        event_type="USER_CREATED",
        success=True,
        user_id=current_user.id,
        request=request,
        metadata={
            "target_user_id": new_user.id,
            "target_email": new_user.email,
            "target_role": new_user.role
        }
    )

    return {
        "message": f"User {new_user.email} created successfully.",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "role": new_user.role,
            "is_active": new_user.is_active
        }
    }

@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")

    target_email = user.email
    target_role = user.role
    target_id = user.id

    db.delete(user)
    db.commit()

    log_audit_event(
        db=db,
        event_type="USER_DELETED",
        success=True,
        user_id=current_user.id,
        request=request,
        metadata={
            "target_user_id": target_id,
            "target_email": target_email,
            "target_role": target_role
        }
    )

    return {"message": f"User {target_email} deleted successfully."}


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

@router.post("/impersonate/{target_user_id}")
def start_impersonation(
    target_user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
    sess = Depends(require_session),
):
    target = db.query(User).filter(User.id == target_user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found")

    if target.role not in {"user", "sponsor"}:
        raise HTTPException(status_code=400, detail="Can only impersonate driver or sponsor accounts")

    if not target.is_active:
        raise HTTPException(status_code=400, detail="Target user is locked/inactive")

    sess.impersonated_user_id = target.id
    db.commit()

    log_audit_event(
        db=db,
        event_type="ADMIN_IMPERSONATION_START",
        success=True,
        user_id=admin_user.id,
        request=request,
        metadata={"target_user_id": target.id, "target_email": target.email, "target_role": target.role},
    )

    return {
        "message": "Impersonation started",
        "user": {"id": target.id, "email": target.email, "role": target.role},
    }

@router.post("/impersonate/stop")
def stop_impersonation(
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_original_user),
    sess = Depends(require_session),
):
    if admin_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if sess.impersonated_user_id is None:
        return {
            "message": "Not impersonating",
            "user": {
                "id": admin_user.id,
                "email": admin_user.email,
                "role": admin_user.role,
            },
        }

    old_target_id = sess.impersonated_user_id
    sess.impersonated_user_id = None
    db.commit()

    log_audit_event(
        db=db,
        event_type="ADMIN_IMPERSONATION_STOP",
        success=True,
        user_id=admin_user.id,
        request=request,
        metadata={"previous_target_user_id": old_target_id},
    )

    return {
        "message": "Impersonation stopped",
        "user": {
            "id": admin_user.id,
            "email": admin_user.email,
            "role": admin_user.role,
        },
    }

@router.get("/impersonate")
def impersonation_status(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
    sess = Depends(require_session),
):
    if not sess.impersonated_user_id:
        return {"is_impersonating": False, "target": None}

    target = db.query(User).filter(User.id == sess.impersonated_user_id).first()
    if not target:
        sess.impersonated_user_id = None
        db.commit()
        return {"is_impersonating": False, "target": None}

    return {
        "is_impersonating": True,
        "target": {"id": target.id, "email": target.email, "role": target.role},
    }