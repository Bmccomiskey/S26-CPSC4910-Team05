from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
from redemptionModels import CatalogRedemption
from catalogModels import CatalogItem
from userModels import User
from sponsorshipModels import SponsorshipApplication
from points import PointTransaction
from audit import log_audit_event

router = APIRouter(prefix="/redemptions", tags=["redemptions"])

@router.post("/")
def redeem_item(driver_id: int, item_id: int, db: Session = Depends(get_db)):

    item = db.query(CatalogItem).filter(CatalogItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if not item.is_active:
        raise HTTPException(status_code=400, detail="Item not available")

    # Verify approval relationship
    approval = db.query(SponsorshipApplication).filter(
        SponsorshipApplication.driver_id == driver_id,
        SponsorshipApplication.sponsor_id == item.sponsor_id,
        SponsorshipApplication.status == "APPROVED"
    ).first()

    if not approval:
        raise HTTPException(status_code=403, detail="Not approved with sponsor")

    # Calculate driver balance
    transactions = db.query(PointsTransaction).filter(
        PointsTransaction.driver_id == driver_id
    ).all()

    balance = sum(t.points for t in transactions)

    if balance < item.point_cost:
        raise HTTPException(status_code=400, detail="Insufficient points")

    # Deduct points
    deduction = PointsTransaction(
        driver_id=driver_id,
        sponsor_id=item.sponsor_id,
        points=-item.point_cost,
        description=f"Redeemed {item.name}"
    )

    db.add(deduction)

    # Create redemption record
    redemption = CatalogRedemption(
        driver_id=driver_id,
        sponsor_id=item.sponsor_id,
        catalog_item_id=item.id,
        points_spent=item.point_cost
    )

    db.add(redemption)
    db.commit()
    db.refresh(redemption)

    log_audit_event(
        db=db,
        event_type="CATALOG_ITEM_REDEEMED",
        success=True,
        user_id=driver_id,
        request=request,
        metadata={
            "driver_id": driver_id,
            "sponsor_id": item.sponsor_id,
            "item_id": item.id,
            "points_spent": item.point_cost
        }
    )

    return {"message": "Item redeemed successfully"}