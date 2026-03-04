from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, Session
from sqlalchemy.sql import func

from db import get_db, Base
from userModels import User
from sponsorshipModels import SponsorshipApplication
from audit import log_audit_event

router = APIRouter(prefix="/points", tags=["points"])


# ── Model ──────────────────────────────────────────────────────────────────
class PointTransaction(Base):
    __tablename__ = "point_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    driver_id: Mapped[int] = mapped_column(Integer, nullable=False)
    sponsor_id: Mapped[int] = mapped_column(Integer, nullable=False)
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ── Schemas ────────────────────────────────────────────────────────────────
class AwardPointsBody(BaseModel):
    sponsor_id: int
    driver_id: int
    points: int
    description: str | None = None


class SubtractPointsBody(BaseModel):
    sponsor_id: int
    driver_id: int
    points: int
    reason: str | None = None


class ResetPointsBody(BaseModel):
    sponsor_id: int
    driver_id: int


# ── Routes ─────────────────────────────────────────────────────────────────

@router.post("/award")
def award_points(body: AwardPointsBody, request: Request, db: Session = Depends(get_db)):
    # Validate sponsor exists
    sponsor = db.query(User).filter(User.id == body.sponsor_id, User.role == "sponsor").first()
    if not sponsor:
        raise HTTPException(status_code=404, detail="Sponsor not found")

    # Validate driver exists
    driver = db.query(User).filter(User.id == body.driver_id, User.role == "user").first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    # Ensure there is an approved relationship between them
    approved = db.query(SponsorshipApplication).filter(
        SponsorshipApplication.sponsor_id == body.sponsor_id,
        SponsorshipApplication.driver_id == body.driver_id,
        SponsorshipApplication.status == "APPROVED"
    ).first()
    if not approved:
        raise HTTPException(status_code=403, detail="No approved sponsorship between this sponsor and driver")

    if body.points <= 0:
        raise HTTPException(status_code=400, detail="Points must be a positive number")

    transaction = PointTransaction(
        driver_id=body.driver_id,
        sponsor_id=body.sponsor_id,
        points=body.points,
        description=body.description,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    log_audit_event(
        db=db,
        event_type="POINTS_AWARDED",
        success=True,
        user_id=body.sponsor_id,
        request=request,
        metadata={"driver_id": body.driver_id, "points": body.points}
    )

    return {"message": "Points awarded successfully", "transaction_id": transaction.id}


@router.post("/subtract")
def subtract_points(body: SubtractPointsBody, request: Request, db: Session = Depends(get_db)):
    # Validate sponsor exists
    sponsor = db.query(User).filter(User.id == body.sponsor_id, User.role == "sponsor").first()
    if not sponsor:
        raise HTTPException(status_code=404, detail="Sponsor not found")

    # Validate driver exists
    driver = db.query(User).filter(User.id == body.driver_id, User.role == "user").first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    # Ensure there is an approved relationship between them
    approved = db.query(SponsorshipApplication).filter(
        SponsorshipApplication.sponsor_id == body.sponsor_id,
        SponsorshipApplication.driver_id == body.driver_id,
        SponsorshipApplication.status == "APPROVED"
    ).first()
    if not approved:
        raise HTTPException(status_code=403, detail="No approved sponsorship between this sponsor and driver")

    if body.points <= 0:
        raise HTTPException(status_code=400, detail="Points must be a positive number")

    transaction = PointTransaction(
        driver_id=body.driver_id,
        sponsor_id=body.sponsor_id,
        points=-body.points,  # stored as negative so balance math stays simple
        description=body.reason,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    log_audit_event(
        db=db,
        event_type="POINTS_SUBTRACTED",
        success=True,
        user_id=body.sponsor_id,
        request=request,
        metadata={"driver_id": body.driver_id, "points": body.points}
    )

    return {"message": "Points subtracted successfully", "transaction_id": transaction.id}


@router.post("/reset")
def reset_points(body: ResetPointsBody, request: Request, db: Session = Depends(get_db)):
    # Validate sponsor exists
    sponsor = db.query(User).filter(User.id == body.sponsor_id, User.role == "sponsor").first()
    if not sponsor:
        raise HTTPException(status_code=404, detail="Sponsor not found")

    # Validate driver exists
    driver = db.query(User).filter(User.id == body.driver_id, User.role == "user").first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    # Ensure there is an approved relationship between them
    approved = db.query(SponsorshipApplication).filter(
        SponsorshipApplication.sponsor_id == body.sponsor_id,
        SponsorshipApplication.driver_id == body.driver_id,
        SponsorshipApplication.status == "APPROVED"
    ).first()
    if not approved:
        raise HTTPException(status_code=403, detail="No approved sponsorship between this sponsor and driver")

    # Calculate current balance for this sponsor<>driver pair and cancel it out
    transactions = db.query(PointTransaction).filter(
        PointTransaction.driver_id == body.driver_id,
        PointTransaction.sponsor_id == body.sponsor_id,
    ).all()
    current_balance = sum(t.points for t in transactions)

    if current_balance == 0:
        return {"message": "Balance is already zero", "transaction_id": None}

    transaction = PointTransaction(
        driver_id=body.driver_id,
        sponsor_id=body.sponsor_id,
        points=-current_balance,  # exactly cancels the running balance
        description="Points reset to zero by sponsor",
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    log_audit_event(
        db=db,
        event_type="POINTS_RESET",
        success=True,
        user_id=body.sponsor_id,
        request=request,
        metadata={"driver_id": body.driver_id, "cancelled_balance": current_balance}
    )

    return {"message": "Points reset to zero successfully", "transaction_id": transaction.id}


@router.get("/sponsor/{sponsor_id}/history")
def get_sponsor_history(sponsor_id: int, db: Session = Depends(get_db)):
    """All transactions this sponsor has made, with driver email."""
    rows = (
        db.query(PointTransaction, User.email)
        .join(User, PointTransaction.driver_id == User.id)
        .filter(PointTransaction.sponsor_id == sponsor_id)
        .order_by(PointTransaction.created_at.desc())
        .all()
    )
    return [
        {
            "id": t.id,
            "driver_id": t.driver_id,
            "driver_email": email,
            "points": t.points,
            "description": t.description,
            "created_at": t.created_at,
        }
        for t, email in rows
    ]


@router.get("/driver/{driver_id}/history")
def get_driver_history(driver_id: int, db: Session = Depends(get_db)):
    """All transactions a driver has received, with sponsor email."""
    rows = (
        db.query(PointTransaction, User.email)
        .join(User, PointTransaction.sponsor_id == User.id)
        .filter(PointTransaction.driver_id == driver_id)
        .order_by(PointTransaction.created_at.desc())
        .all()
    )
    return [
        {
            "id": t.id,
            "sponsor_id": t.sponsor_id,
            "sponsor_email": email,
            "points": t.points,
            "description": t.description,
            "created_at": t.created_at,
        }
        for t, email in rows
    ]


@router.get("/driver/{driver_id}/balance")
def get_driver_balance(driver_id: int, db: Session = Depends(get_db)):
    """Current point balance for a driver (earned minus spent)."""
    transactions = db.query(PointTransaction).filter(
        PointTransaction.driver_id == driver_id
    ).all()
    balance = sum(t.points for t in transactions)
    return {"driver_id": driver_id, "balance": balance}