from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import Integer, String, DateTime, ForeignKey, Boolean, func as sa_func
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
    hidden_from_reports: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=sa_func.false()
    )

# ── Schemas ────────────────────────────────────────────────────────────────
class AwardPointsBody(BaseModel):
    sponsor_id: int
    driver_id: int
    points: int
    description: str | None = None


# ── Schemas ────────────────────────────────────────────────────────────────
class UpdateTransactionBody(BaseModel):
    sponsor_id: int
    points: int
    description: str | None = None


# ── Routes ─────────────────────────────────────────────────────────────────

@router.put("/transactions/{transaction_id}")
def update_transaction(
    transaction_id: int,
    body: UpdateTransactionBody,
    request: Request,
    db: Session = Depends(get_db),
):
    txn = db.query(PointTransaction).filter(PointTransaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if txn.sponsor_id != body.sponsor_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this transaction")

    if body.points == 0:
        raise HTTPException(status_code=400, detail="Points cannot be zero")

    txn.points = body.points
    txn.description = body.description
    db.commit()

    log_audit_event(
        db=db,
        event_type="TRANSACTION_UPDATED",
        success=True,
        user_id=body.sponsor_id,
        request=request,
        metadata={"transaction_id": transaction_id, "new_points": body.points},
    )

    return {"message": "Transaction updated successfully"}


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


@router.get("/sponsor/{sponsor_id}/history")
def get_sponsor_history(sponsor_id: int, db: Session = Depends(get_db)):
    """All transactions this sponsor has made, with driver email."""
    rows = (
        db.query(PointTransaction, User.email)
        .join(User, PointTransaction.driver_id == User.id)
        .filter(
            PointTransaction.sponsor_id == sponsor_id,
            PointTransaction.hidden_from_reports == False
        )
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
        .filter(
            PointTransaction.driver_id == driver_id,
            PointTransaction.hidden_from_reports == False
        )
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
        PointTransaction.driver_id == driver_id,
    ).all()
    
    balance = sum(t.points for t in transactions)

    return {"driver_id": driver_id, "balance": balance}


# ── Goal Model ─────────────────────────────────────────────────────────────
class PointGoal(Base):
    __tablename__ = "point_goals"

    id:            Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    sponsor_id:    Mapped[int]      = mapped_column(Integer, nullable=False)
    driver_id:     Mapped[int]      = mapped_column(Integer, nullable=False)
    title:         Mapped[str]      = mapped_column(String(255), nullable=False)
    description:   Mapped[str|None] = mapped_column(String(500), nullable=True)
    target_points: Mapped[int]      = mapped_column(Integer, nullable=False)
    deadline:      Mapped[str|None] = mapped_column(String(32), nullable=True)
    created_at:    Mapped[str]      = mapped_column(DateTime(timezone=True), server_default=func.now())


# ── Goal Schemas ───────────────────────────────────────────────────────────
class CreateGoalBody(BaseModel):
    sponsor_id:    int
    driver_id:     int
    title:         str
    description:   str | None = None
    target_points: int
    deadline:      str | None = None  # "YYYY-MM-DD"


# ── Goal Routes ────────────────────────────────────────────────────────────

@router.post("/goals")
def create_goal(body: CreateGoalBody, request: Request, db: Session = Depends(get_db)):
    sponsor = db.query(User).filter(User.id == body.sponsor_id, User.role == "sponsor").first()
    if not sponsor:
        raise HTTPException(status_code=404, detail="Sponsor not found")

    driver = db.query(User).filter(User.id == body.driver_id, User.role == "user").first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    approved = db.query(SponsorshipApplication).filter(
        SponsorshipApplication.sponsor_id == body.sponsor_id,
        SponsorshipApplication.driver_id == body.driver_id,
        SponsorshipApplication.status == "APPROVED"
    ).first()
    if not approved:
        raise HTTPException(status_code=403, detail="No approved sponsorship between this sponsor and driver")

    if body.target_points <= 0:
        raise HTTPException(status_code=400, detail="Target points must be positive")

    goal = PointGoal(
        sponsor_id=body.sponsor_id,
        driver_id=body.driver_id,
        title=body.title,
        description=body.description,
        target_points=body.target_points,
        deadline=body.deadline,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    log_audit_event(
        db=db,
        event_type="GOAL_CREATED",
        success=True,
        user_id=body.sponsor_id,
        request=request,
        metadata={"driver_id": body.driver_id, "target_points": body.target_points}
    )

    return {"message": "Goal created successfully", "goal_id": goal.id}


@router.get("/goals/sponsor/{sponsor_id}")
def get_sponsor_goals(sponsor_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(PointGoal, User.email)
        .join(User, PointGoal.driver_id == User.id)
        .filter(PointGoal.sponsor_id == sponsor_id)
        .order_by(PointGoal.created_at.desc())
        .all()
    )
    result = []
    for goal, driver_email in rows:
        earned = db.query(PointTransaction).filter(
            PointTransaction.driver_id == goal.driver_id,
            PointTransaction.sponsor_id == sponsor_id,
            PointTransaction.points > 0,
            PointTransaction.created_at >= goal.created_at,
        ).all()
        current_points = sum(t.points for t in earned)
        result.append({
            "id": goal.id,
            "driver_id": goal.driver_id,
            "driver_email": driver_email,
            "title": goal.title,
            "description": goal.description,
            "target_points": goal.target_points,
            "current_points": current_points,
            "deadline": goal.deadline,
            "created_at": goal.created_at,
            "completed": current_points >= goal.target_points,
        })
    return result


@router.get("/goals/driver/{driver_id}")
def get_driver_goals(driver_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(PointGoal, User.email)
        .join(User, PointGoal.sponsor_id == User.id)
        .filter(PointGoal.driver_id == driver_id)
        .order_by(PointGoal.created_at.desc())
        .all()
    )
    result = []
    for goal, sponsor_email in rows:
        earned = db.query(PointTransaction).filter(
            PointTransaction.driver_id == driver_id,
            PointTransaction.sponsor_id == goal.sponsor_id,
            PointTransaction.points > 0,
            PointTransaction.created_at >= goal.created_at,
        ).all()
        current_points = sum(t.points for t in earned)
        result.append({
            "id": goal.id,
            "sponsor_id": goal.sponsor_id,
            "sponsor_email": sponsor_email,
            "title": goal.title,
            "description": goal.description,
            "target_points": goal.target_points,
            "current_points": current_points,
            "deadline": goal.deadline,
            "created_at": goal.created_at,
            "completed": current_points >= goal.target_points,
        })
    return result


class UpdateGoalBody(BaseModel):
    sponsor_id:    int
    title:         str
    description:   str | None = None
    target_points: int
    deadline:      str | None = None


@router.put("/goals/{goal_id}")
def update_goal(goal_id: int, body: UpdateGoalBody, request: Request, db: Session = Depends(get_db)):
    goal = db.query(PointGoal).filter(PointGoal.id == goal_id, PointGoal.sponsor_id == body.sponsor_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if body.target_points <= 0:
        raise HTTPException(status_code=400, detail="Target points must be positive")

    goal.title = body.title
    goal.description = body.description
    goal.target_points = body.target_points
    goal.deadline = body.deadline
    db.commit()

    log_audit_event(
        db=db,
        event_type="GOAL_UPDATED",
        success=True,
        user_id=body.sponsor_id,
        request=request,
        metadata={"goal_id": goal_id, "new_target": body.target_points},
    )

    return {"message": "Goal updated successfully"}


@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, sponsor_id: int, request: Request, db: Session = Depends(get_db)):
    goal = db.query(PointGoal).filter(PointGoal.id == goal_id, PointGoal.sponsor_id == sponsor_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted"}

# ── Personal Goal Model ────────────────────────────────────────────────────
class PersonalGoal(Base):
    __tablename__ = "personal_goals"

    id:            Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    driver_id:     Mapped[int]      = mapped_column(Integer, nullable=False)
    title:         Mapped[str]      = mapped_column(String(255), nullable=False)
    description:   Mapped[str|None] = mapped_column(String(500), nullable=True)
    target_points: Mapped[int]      = mapped_column(Integer, nullable=False)
    deadline:      Mapped[str|None] = mapped_column(String(32), nullable=True)
    created_at:    Mapped[str]      = mapped_column(DateTime(timezone=True), server_default=func.now())


# ── Personal Goal Schema ───────────────────────────────────────────────────
class CreatePersonalGoalBody(BaseModel):
    driver_id:     int
    title:         str
    description:   str | None = None
    target_points: int
    deadline:      str | None = None  # "YYYY-MM-DD"


# ── Personal Goal Routes ───────────────────────────────────────────────────

@router.post("/goals/personal")
def create_personal_goal(body: CreatePersonalGoalBody, request: Request, db: Session = Depends(get_db)):
    driver = db.query(User).filter(User.id == body.driver_id, User.role == "user").first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    if body.target_points <= 0:
        raise HTTPException(status_code=400, detail="Target points must be positive")

    goal = PersonalGoal(
        driver_id=body.driver_id,
        title=body.title,
        description=body.description,
        target_points=body.target_points,
        deadline=body.deadline,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    log_audit_event(
        db=db,
        event_type="PERSONAL_GOAL_CREATED",
        success=True,
        user_id=body.driver_id,
        request=request,
        metadata={"target_points": body.target_points, "title": body.title}
    )

    return {"message": "Personal goal created successfully", "goal_id": goal.id}


@router.get("/goals/personal/{driver_id}")
def get_personal_goals(driver_id: int, db: Session = Depends(get_db)):
    goals = (
        db.query(PersonalGoal)
        .filter(PersonalGoal.driver_id == driver_id)
        .order_by(PersonalGoal.created_at.desc())
        .all()
    )

    result = []
    for goal in goals:
        # current_points = all points earned by this driver since the goal was created
        earned = db.query(PointTransaction).filter(
            PointTransaction.driver_id == driver_id,
            PointTransaction.points > 0,
            PointTransaction.created_at >= goal.created_at,
        ).all()
        current_points = sum(t.points for t in earned)
        result.append({
            "id": goal.id,
            "driver_id": goal.driver_id,
            "title": goal.title,
            "description": goal.description,
            "target_points": goal.target_points,
            "current_points": current_points,
            "deadline": goal.deadline,
            "created_at": goal.created_at,
            "completed": current_points >= goal.target_points,
        })
    return result


@router.delete("/goals/personal/{goal_id}")
def delete_personal_goal(goal_id: int, driver_id: int, request: Request, db: Session = Depends(get_db)):
    goal = db.query(PersonalGoal).filter(
        PersonalGoal.id == goal_id,
        PersonalGoal.driver_id == driver_id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Personal goal not found")
    db.delete(goal)
    db.commit()

    log_audit_event(
        db=db,
        event_type="PERSONAL_GOAL_DELETED",
        success=True,
        user_id=driver_id,
        request=request,
        metadata={"goal_id": goal_id}
    )

    return {"message": "Personal goal deleted"}

class RedeemItemBody(BaseModel):
    driver_id: int
    sponsor_id: int
    item_id: int
    item_name: str
    point_cost: int

@router.post("/redeem")
def redeem_item(body: RedeemItemBody, request: Request, db: Session = Depends(get_db)):

    # Validate driver
    driver = db.query(User).filter(User.id == body.driver_id, User.role == "user").first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    # Validate sponsor relationship
    approved = db.query(SponsorshipApplication).filter(
        SponsorshipApplication.driver_id == body.driver_id,
        SponsorshipApplication.sponsor_id == body.sponsor_id,
        SponsorshipApplication.status == "APPROVED"
    ).first()

    if not approved:
        raise HTTPException(status_code=403, detail="Not approved with this sponsor")

    # Calculate balance
    transactions = db.query(PointTransaction).filter(
    PointTransaction.driver_id == body.driver_id,
    PointTransaction.sponsor_id == body.sponsor_id,
    PointTransaction.hidden_from_reports == False
    ).all()
    
    balance = sum(t.points for t in transactions)

    

    if balance < body.point_cost:
        raise HTTPException(status_code=400, detail="Insufficient points")

    # Deduct points (negative transaction)
    redemption = PointTransaction(
        driver_id=body.driver_id,
        sponsor_id=body.sponsor_id,
        points=-body.point_cost,
        description=f"Redeemed: {body.item_name}"
    )

    db.add(redemption)
    db.commit()

    log_audit_event(
        db=db,
        event_type="ITEM_REDEEMED",
        success=True,
        user_id=body.driver_id,
        request=request,
        metadata={
            "item_id": body.item_id,
            "points_spent": body.point_cost
        }
    )

    return {"message": "Item redeemed successfully"}


class CancelRedemptionBody(BaseModel):
    driver_id: int


@router.post("/cancel/{transaction_id}")
def cancel_redemption(
    transaction_id: int,
    body: CancelRedemptionBody,
    request: Request,
    db: Session = Depends(get_db),
):
    txn = db.query(PointTransaction).filter(
        PointTransaction.id == transaction_id,
        PointTransaction.driver_id == body.driver_id,
    ).first()

    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if not txn.description or not txn.description.startswith("Redeemed:"):
        raise HTTPException(status_code=400, detail="This transaction is not a redemption")

    created = txn.created_at
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) - created > timedelta(minutes=10):
        raise HTTPException(status_code=400, detail="Cancellation window has expired (10 minutes)")

    item_name = txn.description[len("Redeemed: "):]

    # Mark original transaction as cancelled
    txn.description = f"Cancelled: {item_name}"

    # Refund the points
    refund = PointTransaction(
        driver_id=txn.driver_id,
        sponsor_id=txn.sponsor_id,
        points=-txn.points,
        description=f"Refund: {item_name}",
    )
    db.add(refund)
    db.commit()

    log_audit_event(
        db=db,
        event_type="ITEM_CANCELLED",
        success=True,
        user_id=body.driver_id,
        request=request,
        metadata={"transaction_id": transaction_id},
    )

    return {"message": "Order cancelled and points refunded"}


class AdminBulkAdjustBody(BaseModel):
    admin_id: int
    driver_ids: list[int]
    operation: str
    points: int
    reason: str | None = None
    hidden_from_reports: bool = False

@router.get("/admin/drivers")
def get_admin_driver_point_list(db: Session = Depends(get_db)):
    drivers = db.query(User).filter(User.role == "user").order_by(User.email.asc()).all()
    results = []

    for driver in drivers:
        transactions = db.query(PointTransaction).filter(
        PointTransaction.driver_id == body.driver_id,
        PointTransaction.sponsor_id == body.sponsor_id,
        PointTransaction.hidden_from_reports == False
        ).all()
        
        balance = sum(t.points for t in transactions)

        sponsor_rows = (
            db.query(User.email)
            .join(SponsorshipApplication, SponsorshipApplication.sponsor_id == User.id)
            .filter(
                SponsorshipApplication.driver_id == driver.id,
                SponsorshipApplication.status == "APPROVED",
                User.role == "sponsor",
            )
            .all()
        )
        sponsor_emails = sorted({email for (email,) in sponsor_rows if email})

        results.append({
            "driver_id": driver.id,
            "driver_email": driver.email,
            "balance": balance,
            "sponsors": sponsor_emails,
            "sponsor_display": ", ".join(sponsor_emails) if sponsor_emails else "—",
        })

    return results

@router.get("/admin/sponsors")
def get_admin_sponsor_point_list(db: Session = Depends(get_db)):
    sponsors = db.query(User).filter(User.role == "sponsor").order_by(User.email.asc()).all()
    results = []

    for sponsor in sponsors:
        transactions = db.query(PointTransaction).filter(
        PointTransaction.driver_id == body.driver_id,
        PointTransaction.sponsor_id == body.sponsor_id,
        PointTransaction.hidden_from_reports == False
        ).all()

        total_awarded = sum(t.points for t in transactions)

        driver_rows = (
            db.query(User.email)
            .join(SponsorshipApplication, SponsorshipApplication.driver_id == User.id)
            .filter(
                SponsorshipApplication.sponsor_id == sponsor.id,
                SponsorshipApplication.status == "APPROVED",
                User.role == "user",
            )
            .all()
        )
        driver_emails = sorted({email for (email,) in driver_rows if email})

        results.append({
            "sponsor_id": sponsor.id,
            "sponsor_email": sponsor.email,
            "total_awarded": total_awarded,
            "drivers": driver_emails,
            "driver_display": ", ".join(driver_emails) if driver_emails else "—",
        })

    return results

@router.get("/driver/{driver_id}/balance/{sponsor_id}")
def get_driver_balance_for_sponsor(driver_id: int, sponsor_id: int, db: Session = Depends(get_db)):
    approved = db.query(SponsorshipApplication).filter(
        SponsorshipApplication.driver_id == driver_id,
        SponsorshipApplication.sponsor_id == sponsor_id,
        SponsorshipApplication.status == "APPROVED"
    ).first()
    if not approved:
        raise HTTPException(status_code=403, detail="No approved sponsorship with this sponsor")

    transactions = db.query(PointTransaction).filter(
        PointTransaction.driver_id == driver_id,
        PointTransaction.sponsor_id == sponsor_id,
        PointTransaction.hidden_from_reports == False
    ).all()

    balance = sum(t.points for t in transactions)
    return {
        "driver_id": driver_id,
        "sponsor_id": sponsor_id,
        "balance": balance,
    }


@router.get("/driver/{driver_id}/history/{sponsor_id}")
def get_driver_history_for_sponsor(driver_id: int, sponsor_id: int, db: Session = Depends(get_db)):
    approved = db.query(SponsorshipApplication).filter(
        SponsorshipApplication.driver_id == driver_id,
        SponsorshipApplication.sponsor_id == sponsor_id,
        SponsorshipApplication.status == "APPROVED"
    ).first()
    if not approved:
        raise HTTPException(status_code=403, detail="No approved sponsorship with this sponsor")

    rows = (
        db.query(PointTransaction, User.email)
        .join(User, PointTransaction.sponsor_id == User.id)
        .filter(
            PointTransaction.driver_id == driver_id,
            PointTransaction.sponsor_id == sponsor_id,
            PointTransaction.hidden_from_reports == False
        )
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

@router.post("/admin/bulk-adjust")
def admin_bulk_adjust_points(body: AdminBulkAdjustBody, request: Request, db: Session = Depends(get_db)):
    admin_user = db.query(User).filter(
        User.id == body.admin_id,
        User.role == "admin"
    ).first()
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")

    driver_ids = sorted({int(driver_id) for driver_id in body.driver_ids if driver_id})
    if not driver_ids:
        raise HTTPException(status_code=400, detail="Please select at least one driver")

    if body.points <= 0:
        raise HTTPException(status_code=400, detail="Points must be greater than zero")

    operation = (body.operation or "").strip().lower()
    if operation not in {"add", "subtract"}:
        raise HTTPException(status_code=400, detail="Operation must be add or subtract")

    delta = body.points if operation == "add" else -body.points

    drivers = db.query(User).filter(User.id.in_(driver_ids), User.role == "user").all()
    found_ids = {driver.id for driver in drivers}
    missing_ids = [driver_id for driver_id in driver_ids if driver_id not in found_ids]
    if missing_ids:
        raise HTTPException(
            status_code=404,
            detail=f"Driver(s) not found: {', '.join(map(str, missing_ids))}"
        )

    reason = (body.reason or "").strip() or None

    for driver in drivers:
        transaction = PointTransaction(
            driver_id=driver.id,
            sponsor_id=admin_user.id,
            points=delta,
            description=reason,
            hidden_from_reports=body.hidden_from_reports,
        )
        db.add(transaction)

    db.commit()

    log_audit_event(
        db=db,
        event_type="ADMIN_POINTS_BULK_ADJUSTED",
        success=True,
        user_id=body.admin_id,
        request=request,
        metadata={
            "driver_ids": driver_ids,
            "operation": operation,
            "points": body.points,
            "hidden_from_reports": body.hidden_from_reports,
        },
    )

    return {
        "message": f"Point adjustment applied to {len(driver_ids)} driver(s)",
        "drivers_updated": len(driver_ids),
    }