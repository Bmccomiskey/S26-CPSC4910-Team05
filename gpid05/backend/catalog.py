from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db import get_db
from catalogModels import CatalogItem
import requests
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base

router = APIRouter(prefix="/catalog", tags=["catalog"])

class CatalogConfig(Base):
    __tablename__ = "catalog_config"

    id = Column(Integer, primary_key=True)
    sponsor_id = Column(Integer, ForeignKey("users.id"), unique=True)
    min_point_cost = Column(Integer, default=0)
    max_point_cost = Column(Integer, default=1000000)
    points_per_dollar = Column(Integer, default=100)  # 1 USD = 100 points


@router.post("/{sponsor_id}/refresh")
def refresh_catalog(sponsor_id: int, db: Session = Depends(get_db)):
    response = requests.get("https://fakestoreapi.com/products")

    if response.status_code != 200:
        return {"status": "ERROR", "message": "Failed to fetch external API"}

    products = response.json()

    config = db.query(CatalogConfig).filter(
        CatalogConfig.sponsor_id == sponsor_id
    ).first()

    if not config:
        config = CatalogConfig(sponsor_id=sponsor_id)
        db.add(config)
        db.commit()
        db.refresh(config)

    for product in products:
        existing = db.query(CatalogItem).filter(
            CatalogItem.sponsor_id == sponsor_id,
            CatalogItem.external_id == product["id"]
        ).first()

        point_cost = int(product["price"] * config.points_per_dollar)

        within_range = (
            config.min_point_cost <= point_cost <= config.max_point_cost
        )

        if existing:
            existing.name = product["title"]
            existing.description = product["description"]
            existing.image_url = product["image"]
            existing.price_usd = product["price"]
            existing.point_cost = point_cost
            existing.last_updated = datetime.utcnow()
            existing.is_active = within_range
        else:
            new_item = CatalogItem(
                sponsor_id=sponsor_id,
                external_id=product["id"],
                name=product["title"],
                description=product["description"],
                image_url=product["image"],
                price_usd=product["price"],
                point_cost=point_cost,
                is_active=within_range,
                last_updated=datetime.utcnow()
            )
            db.add(new_item)

    db.commit()

    return {"status": "SUCCESS", "message": "Catalog refreshed"}

@router.get("/sponsor/{sponsor_id}")
def get_catalog(
    sponsor_id: int,
    search: str = None,
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(CatalogItem).filter(
        CatalogItem.sponsor_id == sponsor_id
    )

    if not include_inactive:
        query = query.filter(CatalogItem.is_active == True)

    if search:
        query = query.filter(CatalogItem.name.ilike(f"%{search}%"))

    items = query.all()

    if not items:
        return {"last_updated": None, "items": []}

    last_updated = max(item.last_updated for item in items)

    return {
        "last_updated": last_updated,
        "items": [
            {
                "id": item.id,
                "name": item.name,
                "description": item.description,
                "image_url": item.image_url,
                "price_usd": item.price_usd,
                "point_cost": item.point_cost,
                "is_active": item.is_active
            }
            for item in items
        ]
    }

@router.post("/{sponsor_id}/remove/{item_id}")
def remove_item(sponsor_id: int, item_id: int, db: Session = Depends(get_db)):
    item = db.query(CatalogItem).filter(
        CatalogItem.id == item_id,
        CatalogItem.sponsor_id == sponsor_id
    ).first()

    if not item:
        return {"status": "ERROR", "message": "Item not found"}

    item.is_active = False
    db.commit()

    return {"status": "SUCCESS", "message": "Item removed"}

@router.post("/{sponsor_id}/activate/{item_id}")
def activate_item(sponsor_id: int, item_id: int, db: Session = Depends(get_db)):
    item = db.query(CatalogItem).filter(
        CatalogItem.id == item_id,
        CatalogItem.sponsor_id == sponsor_id
    ).first()

    if not item:
        return {"status": "ERROR", "message": "Item not found"}

    config = db.query(CatalogConfig).filter(
        CatalogConfig.sponsor_id == sponsor_id
    ).first()

    if not config:
        config = CatalogConfig(sponsor_id=sponsor_id)
        db.add(config)
        db.commit()
        db.refresh(config)

    if not (config.min_point_cost <= item.point_cost <= config.max_point_cost):
        return {
            "status": "ERROR",
            "message": "Item outside allowed point range"
        }

    item.is_active = True
    db.commit()

    return {"status": "SUCCESS", "message": "Item activated"}

@router.post("/{sponsor_id}/config")
def update_catalog_config(
    sponsor_id: int,
    min_point_cost: int,
    max_point_cost: int,
    points_per_dollar: int,
    db: Session = Depends(get_db)
):
    config = db.query(CatalogConfig).filter(
        CatalogConfig.sponsor_id == sponsor_id
    ).first()

    if not config:
        config = CatalogConfig(sponsor_id=sponsor_id)

    config.min_point_cost = min_point_cost
    config.max_point_cost = max_point_cost
    config.points_per_dollar = points_per_dollar

    db.add(config)
    db.commit()
    db.refresh(config)

    items = db.query(CatalogItem).filter(
        CatalogItem.sponsor_id == sponsor_id
    ).all()

    for item in items:
        item.point_cost = int(item.price_usd * config.points_per_dollar)
        item.is_active = (
            config.min_point_cost <= item.point_cost <= config.max_point_cost
        )

    db.commit()

    return {"status": "SUCCESS"}

@router.get("/external/search")
def search_external_catalog(search: str = ""):
    response = requests.get("https://fakestoreapi.com/products")

    if response.status_code != 200:
        return {"items": []}

    products = response.json()

    if search:
        products = [
            p for p in products
            if search.lower() in p["title"].lower()
        ]

    return {
        "items": [
            {
                "external_id": p["id"],
                "name": p["title"],
                "description": p["description"],
                "image_url": p["image"],
                "price_usd": p["price"]
            }
            for p in products
        ]
    }

@router.post("/{sponsor_id}/add-external/{external_id}")
def add_external_item(sponsor_id: int, external_id: int, db: Session = Depends(get_db)):
    config = db.query(CatalogConfig).filter(
        CatalogConfig.sponsor_id == sponsor_id
    ).first()

    if not config:
        config = CatalogConfig(sponsor_id=sponsor_id)
        db.add(config)
        db.commit()
        db.refresh(config)

    existing = db.query(CatalogItem).filter(
        CatalogItem.sponsor_id == sponsor_id,
        CatalogItem.external_id == external_id
    ).first()

    if existing:
        existing.point_cost = int(existing.price_usd * config.points_per_dollar)
        existing.is_active = (
            config.min_point_cost <= existing.point_cost <= config.max_point_cost
        )
        db.commit()
        return {"status": "SUCCESS", "message": "Item already existed and was reactivated"}

    response = requests.get(f"https://fakestoreapi.com/products/{external_id}")

    if response.status_code != 200:
        return {"status": "ERROR", "message": "External item not found"}

    product = response.json()
    point_cost = int(product["price"] * config.points_per_dollar)

    item = CatalogItem(
        sponsor_id=sponsor_id,
        external_id=product["id"],
        name=product["title"],
        description=product["description"],
        image_url=product["image"],
        price_usd=product["price"],
        point_cost=point_cost,
        is_active=(config.min_point_cost <= point_cost <= config.max_point_cost),
        last_updated=datetime.utcnow()
    )

    db.add(item)
    db.commit()

    return {"status": "SUCCESS", "message": "Item added to catalog"}