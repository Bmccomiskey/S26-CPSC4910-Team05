from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from typing import List
from sqlalchemy.orm import Session

import io


from db import get_db
from points import PointTransaction
from sponsorshipModels import SponsorshipApplication
from userModels import User
from sysModels import VersionInfo
from sessions import require_role, require_admin_user, require_session, require_original_user
from pydantic import BaseModel
from security import hash_password
from audit import log_audit_event
from profileModels import UserProfile
from admin import admin_create_user
from orgModels import Organization, OrganizationMembership


router = APIRouter(prefix="/upload", tags=["upload"])

def get_sponsor_org(user: User, db: Session):
    membership = (
        db.query(OrganizationMembership)
        .filter(OrganizationMembership.user_id == user.id)
        .first()
    )

    if not membership:
        return None

    return db.query(Organization).filter(
        Organization.org_id == membership.org_id
    ).first()

def process_line(line: str, line_number: int, db: Session, current_user: User):
    parts = line.strip().split("|")

    if len(parts) < 1:
        return None, f"Line {line_number}: Invalid format"

    record_type = parts[0]

    if record_type not in {"O", "D", "S"}:
        return None, f"Line {line_number}: Invalid type '{record_type}'"

    org_name = parts[1] if len(parts) > 1 else None
    first = parts[2] if len(parts) > 2 else None
    last = parts[3] if len(parts) > 3 else None
    email = parts[4] if len(parts) > 4 else None
    points = parts[5] if len(parts) > 5 else None
    reason = parts[6] if len(parts) > 6 else None

    role = current_user.role

    if points and not reason:
        return None, f"Line {line_number}: Points require a reason"

    if record_type in {"D", "S"} and not email:
        return None, f"Line {line_number}: Email required"


    if record_type == "O":
        if role != "admin":
            return None, f"Line {line_number}: Only admins can create organizations"

        if not org_name:
            return None, f"Line {line_number}: Organization name required"

        existing = db.query(Organization).filter(
            Organization.org_name == org_name
        ).first()

        if existing:
            return None, f"Line {line_number}: Organization already exists"

        db.add(Organization(org_name=org_name))
        return f"Organization created: {org_name}", None


    org = None

    if role == "admin":
        if not org_name:
            return None, f"Line {line_number}: Organization required"

        org = db.query(Organization).filter(
            Organization.org_name == org_name
        ).first()

        if not org:
            return None, f"Line {line_number}: Organization '{org_name}' does not exist"

    elif role == "sponsor":
        org = get_sponsor_org(current_user, db)

        if not org:
            return None, f"Line {line_number}: Sponsor has no organization"

        # Override any provided org_name
        org_name = org.org_name

        if record_type == "O":
            return None, f"Line {line_number}: Sponsors cannot create organizations"

        if record_type == "S" and points:
            return None, f"Line {line_number}: Cannot assign points to sponsors"

    else:
        return None, f"Line {line_number}: Unauthorized role"


    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            email=email,
            role="user" if record_type == "D" else "sponsor",
            password_hash=hash_password("Temp123!"),
            is_active=True
        )
        db.add(user)
        db.flush()  # ensures user.id is available


    membership = db.query(OrganizationMembership).filter(
        OrganizationMembership.org_id == org.org_id,
        OrganizationMembership.user_id == user.id
    ).first()

    if not membership:
        db.add(OrganizationMembership(
            org_id=org.org_id,
            user_id=user.id
        ))

    #point handling
    points_val = None
    if record_type == "D" and points:
        try:
            points_val = int(points)
        except ValueError:
            return None, f"Line {line_number}: Invalid points value"

    #determine sponsor
    sponsor_id = None

    if role == "admin":
        sponsor_id = current_user.id  # admin acts as sponsor

    elif role == "sponsor":
        sponsor_id = current_user.id

        # Ensure approved sponsorship
        approved = db.query(SponsorshipApplication).filter(
            SponsorshipApplication.driver_id == user.id,
            SponsorshipApplication.sponsor_id == sponsor_id,
            SponsorshipApplication.status == "APPROVED"
        ).first()

        if not approved:
            return None, f"Line {line_number}: No approved sponsorship for {email}"

    #create transaction
    transaction = PointTransaction(
        driver_id=user.id,
        sponsor_id=sponsor_id,
        points=points_val,
        description=reason
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
        

    return f"{record_type} processed: {email}", None

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