from sqlalchemy.orm import Session
from fastapi import Request
from auditModels import AuditLog
import json


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
