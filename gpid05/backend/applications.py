from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db import get_db
from userModels import User
from sponsorshipModels import SponsorshipApplication
from audit import log_audit_event

router = APIRouter(prefix="/applications", tags=["applications"])


class ApplicationCreateBody(BaseModel):
    driver_id: int
    sponsor_id: int

@router.post("/")
def create_application(
    body: ApplicationCreateBody,
    request: Request,
    db: Session = Depends(get_db)
):
    driver = db.query(User).filter(User.id == body.driver_id).first()
    sponsor = db.query(User).filter(User.id == body.sponsor_id).first()

    if not driver or driver.role != "user":
        raise HTTPException(status_code=400, detail="Invalid driver")

    if not sponsor or sponsor.role != "sponsor":
        raise HTTPException(status_code=400, detail="Invalid sponsor")

    # 🔒 Duplicate protection
    existing_application = db.query(SponsorshipApplication).filter(
        SponsorshipApplication.driver_id == body.driver_id,
        SponsorshipApplication.sponsor_id == body.sponsor_id,
        SponsorshipApplication.status == "PENDING"
    ).first()

    if existing_application:
        raise HTTPException(
            status_code=400,
            detail="You already have a pending application with this sponsor"
        )

    application = SponsorshipApplication(
        driver_id=body.driver_id,
        sponsor_id=body.sponsor_id,
        status="PENDING"
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return {"message": "Application submitted successfully"}

@router.get("/sponsor/{sponsor_id}")
def get_sponsor_applications(
    sponsor_id: int,
    db: Session = Depends(get_db)
):
    applications = (
        db.query(SponsorshipApplication, User.email)
        .join(User, SponsorshipApplication.driver_id == User.id)
        .filter(SponsorshipApplication.sponsor_id == sponsor_id)
        .all()
    )

    result = []
    for app, driver_email in applications:
        result.append({
            "id": app.id,
            "driver_id": app.driver_id,
            "driver_email": driver_email,
            "status": app.status
        })

    return result


@router.post("/{application_id}/approve")
def approve_application(
    application_id: int,
    sponsor_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    application = db.query(SponsorshipApplication).filter(
        SponsorshipApplication.id == application_id
    ).first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if application.sponsor_id != sponsor_id:
        raise HTTPException(status_code=403, detail="Not authorized to approve this application")

    if application.status != "PENDING":
        raise HTTPException(status_code=400, detail="Application already processed")

    application.status = "APPROVED"
    db.commit()

    log_audit_event(
        db=db,
        event_type="APPLICATION_APPROVED",
        success=True,
        user_id=sponsor_id,
        request=request,
        metadata={
            "application_id": application.id,
            "driver_id": application.driver_id
        }
    )

    return {"message": "Application approved"}
@router.post("/{application_id}/reject")
def reject_application(
    application_id: int,
    sponsor_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    application = db.query(SponsorshipApplication).filter(
        SponsorshipApplication.id == application_id
    ).first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if application.sponsor_id != sponsor_id:
        raise HTTPException(status_code=403, detail="Not authorized to reject this application")

    if application.status != "PENDING":
        raise HTTPException(status_code=400, detail="Application already processed")

    application.status = "REJECTED"
    db.commit()

    log_audit_event(
        db=db,
        event_type="APPLICATION_REJECTED",
        success=True,
        user_id=sponsor_id,
        request=request,
        metadata={
            "application_id": application.id,
            "driver_id": application.driver_id
        }
    )

    return {"message": "Application rejected"}

@router.get("/sponsors")
def get_all_sponsors(db: Session = Depends(get_db)):
    sponsors = db.query(User).filter(User.role == "sponsor").all()

    return [
        {
            "id": sponsor.id,
            "email": sponsor.email
        }
        for sponsor in sponsors
    ]

@router.get("/driver/{driver_id}")
def get_driver_applications(
    driver_id: int,
    db: Session = Depends(get_db)
):
    applications = (
        db.query(SponsorshipApplication, User.email)
        .join(User, SponsorshipApplication.sponsor_id == User.id)
        .filter(SponsorshipApplication.driver_id == driver_id)
        .all()
    )

    return [
        {
            "id": app.id,
            "sponsor_id": app.sponsor_id,
            "sponsor_email": sponsor_email,
            "status": app.status
        }
        for app, sponsor_email in applications
    ]
