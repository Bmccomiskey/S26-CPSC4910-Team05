from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from db import Base

class Organization(Base):
    __tablename__ = "organizations"

    org_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, unique=True)
    org_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)


class OrganizationMembership(Base):
    __tablename__ = "organization_memberships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)

    org_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.org_id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    # Prevent duplicate memberships
    

    # Relationships
    #organization = relationship("Organization", back_populates="members")
    #user = relationship("User", back_populates="organizations")