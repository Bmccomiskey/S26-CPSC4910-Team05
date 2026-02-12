from sqlalchemy.orm import Session
from fastapi import Request
from auditModels import AuditLog

def log_audit_event(
    db: Session,
    event_type: str,
    success: bool,
    user_id: int | None = None,
    request: Request | None = None,
):
    ip_address = None
    if request:
        ip_address = request.client.host

    log_entry = AuditLog(
        user_id=user_id,
        event_type=event_type,
        success=success,
        ip_address=ip_address,
    )

    db.add(log_entry)
    db.commit()
