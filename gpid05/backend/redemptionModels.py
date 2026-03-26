from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from db import Base

class CatalogRedemption(Base):
    __tablename__ = "catalog_redemptions"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("users.id"))
    sponsor_id = Column(Integer, ForeignKey("users.id"))
    catalog_item_id = Column(Integer)
    points_spent = Column(Integer)
    status = Column(String(50), default="COMPLETED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


