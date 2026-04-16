from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import or_
from sqlalchemy.orm import Session
from auditModels import AuditLog
from db import get_db
from sessions import require_admin_user
from userModels import User
import json

router = APIRouter(prefix="/audit", tags=["audit"])


def log_audit_event(
    db: Session,
    event_type: str,
    success: bool,
    user_id: int | None = None,
    request: Request | None = None,
    metadata: dict | None = None,
):
    ip_address = None

    if request and request.client:
        ip_address = request.client.host

    log_entry = AuditLog(
        user_id=user_id,
        event_type=event_type,
        success=success,
        ip_address=ip_address,
        event_data=json.dumps(metadata) if metadata else None,
    )

    db.add(log_entry)
    db.commit()


@router.get("/types")
def get_audit_types(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    rows = db.query(AuditLog.event_type).distinct().order_by(AuditLog.event_type.asc()).all()
    return [row[0] for row in rows if row[0]]


@router.get("/logs")
def get_audit_logs(
    search: str | None = Query(default=None),
    event_type: str | None = Query(default=None),
    role: str | None = Query(default=None),
    success: str | None = Query(default=None),  # all | success | failure
    user_id: int | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin_user),
):
    query = (
        db.query(AuditLog, User.email, User.role)
        .outerjoin(User, AuditLog.user_id == User.id)
    )

    if event_type:
        query = query.filter(AuditLog.event_type == event_type)

    if role:
        query = query.filter(User.role == role)

    if success == "success":
        query = query.filter(AuditLog.success == True)
    elif success == "failure":
        query = query.filter(AuditLog.success == False)

    if user_id is not None:
        query = query.filter(AuditLog.user_id == user_id)

    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                AuditLog.event_type.ilike(term),
                AuditLog.ip_address.ilike(term),
                AuditLog.event_data.ilike(term),
                User.email.ilike(term),
            )
        )

    total = query.count()

    rows = (
        query.order_by(AuditLog.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    logs = []
    for log, user_email, user_role in rows:
        parsed_event_data = None
        if log.event_data:
            try:
                parsed_event_data = json.loads(log.event_data)
            except Exception:
                parsed_event_data = log.event_data

        logs.append({
            "id": log.id,
            "created_at": log.created_at,
            "event_type": log.event_type,
            "success": log.success,
            "ip_address": log.ip_address,
            "user_id": log.user_id,
            "user_email": user_email,
            "user_role": user_role,
            "event_data": parsed_event_data,
        })

    return {
        "logs": logs,
        "page": page,
        "per_page": per_page,
        "total": total,
        "total_pages": (total + per_page - 1) // per_page,
    }