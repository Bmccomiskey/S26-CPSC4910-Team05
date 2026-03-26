from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db import get_db
from profileModels import UserProfile

router = APIRouter(prefix="/profile", tags=["profile"])

class ProfileBody(BaseModel):
    phone:          str | None = None
    first_name:     str | None = None
    last_name:      str | None = None
    city:           str | None = None
    state:          str | None = None
    cdl_number:     str | None = None
    cdl_class:      str | None = None
    years_exp:      str | None = None
    company_name:   str | None = None
    contact_name:   str | None = None
    website:        str | None = None
    address:        str | None = None
    industry:       str | None = None
    point_budget:   str | None = None
    min_point_cost: str | None = None
    max_point_cost: str | None = None

def serialize_profile(profile: UserProfile | None):
    if not profile:
        return {}

    return {
        "phone":          profile.phone,
        "first_name":     profile.first_name,
        "last_name":      profile.last_name,
        "city":           profile.city,
        "state":          profile.state,
        "cdl_number":     profile.cdl_number,
        "cdl_class":      profile.cdl_class,
        "years_exp":      profile.years_exp,
        "company_name":   profile.company_name,
        "contact_name":   profile.contact_name,
        "website":        profile.website,
        "address":        profile.address,
        "industry":       profile.industry,
        "point_budget":   profile.point_budget,
        "min_point_cost": profile.min_point_cost,
        "max_point_cost": profile.max_point_cost,
    }

@router.get("/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    return serialize_profile(profile)

@router.put("/{user_id}")
def save_profile(user_id: int, body: ProfileBody, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)

    for field, value in body.model_dump().items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return {
        "message": "Profile saved",
        "profile": serialize_profile(profile),
    }