from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from typing import List
from sqlalchemy.orm import Session

import io


from db import get_db
from userModels import User
from sysModels import VersionInfo
from sessions import require_role, require_admin_user, require_session, require_original_user
from pydantic import BaseModel
from security import hash_password
from audit import log_audit_event
from profileModels import UserProfile
from admin import admin_create_user
from orgModels import Organization


router = APIRouter(prefix="/upload", tags=["upload"])

def process_line(line: str, line_number: int, db: Session, current_user: User):
    parts = line.strip().split("|")

    if len(parts) < 1:
        return None, f"Line {line_number}: Invalid format"

    record_type = parts[0]

    if record_type not in {"O", "D", "S"}:
        return None, f"Line {line_number}: Invalid type '{record_type}'"

    org = parts[1] if len(parts) > 1 else None
    first = parts[2] if len(parts) > 2 else None
    last = parts[3] if len(parts) > 3 else None
    email = parts[4] if len(parts) > 4 else None
    points = parts[5] if len(parts) > 5 else None
    reason = parts[6] if len(parts) > 6 else None

    role = current_user.role

    #validation rules
    if points and not reason:
        return None, f"Line {line_number}: Points require a reason"

    if not email and record_type in {"D", "S"}:
        return None, f"Line {line_number}: Email required"

    
    #role is admin
    if role == "admin":

        # O → create organization
        if record_type == "O":
            existing = db.query(Organization).filter(
                Organization.org_name == org
            ).first()

            if existing:
                return None, f"Line {line_number}: Organization exists"

            db.add(Organization(org_name=org))
            return f"Organization created: {org}", None

        # Must have org for D/S
        if not org:
            return None, f"Line {line_number}: Organization required"

    #role is sponsor
    if role == "sponsor":

        # Rule: cannot use O
        if record_type == "O":
            return None, f"Line {line_number}: Sponsors cannot create organizations"

        # Force org to sponsor's org
        org = current_user.company_name

        # Rule: no points for sponsors
        if record_type == "S" and points:
            return None, f"Line {line_number}: Cannot assign points to sponsors"

    #driver handling
    if record_type == "D":
        user = db.query(User).filter(User.email == email).first()

        if not user:
            user = User(
                email=email,
                role="user",
                password_hash=hash_password("Temp123!"),
                is_active=True
            )
            db.add(user)
            db.flush()

        if points:
            # Replace with real points system
            pass

        return f"Driver processed: {email}", None

    #sponsor handling
    if record_type == "S":
        user = db.query(User).filter(User.email == email).first()

        if not user:
            user = User(
                email=email,
                role="sponsor",
                password_hash=hash_password("Temp123!"),
                is_active=True
            )
            db.add(user)
            db.flush()

        return f"Sponsor processed: {email}", None

    return None, f"Line {line_number}: Unknown error"

@router.post("/bulk")
def admin_bulk_upload(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "sponsor"))
):
    filename = getattr(file, "filename", "") or ""
    if not filename.lower().endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt files are allowed.")

    content = file.file.read().decode("utf-8")
    stream = io.StringIO(content)

    success_count = 0
    errors = []
    result = None

    for line_number, line in enumerate(stream, start=1):
        if not line.strip():
            continue

        result, error = process_line(
            line=line,
            line_number=line_number,
            db=db,
            current_user=current_user
        )

        if error:
            errors.append(error)
        else:
            success_count += 1

    db.commit()

    if result:
        log_audit_event(
            db=db,
            event_type="BULK_UPLOAD_ROW",
            success=True,
            user_id=current_user.id,
            request=request,
            metadata={
                "role": current_user.role,
                "message": result}
        )
    else:
        log_audit_event(
            db=db,
            event_type="BULK_UPLOAD_ROW",
            success=False,
            user_id=current_user.id,
            request=request,
            metadata={
                "role": current_user.role,
                "success_count": success_count,
                "error_count": len(errors)
            }
        )

    return {
        "message": "Bulk upload processed.",
        "success_count": success_count,
        "error_count": len(errors),
        "errors": errors
    }