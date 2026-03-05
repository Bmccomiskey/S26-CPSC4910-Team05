from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base

class CatalogItem(Base):
    __tablename__ = "catalog_items"

    id = Column(Integer, primary_key=True, index=True)
    sponsor_id = Column(Integer, ForeignKey("users.id"))
    external_id = Column(Integer)
    name = Column(String(255))
    description = Column(String(1000))
    image_url = Column(String(500))
    price_usd = Column(Float)
    point_cost = Column(Integer)
    is_active = Column(Boolean, default=True)
    last_updated = Column(DateTime, default=datetime.utcnow)