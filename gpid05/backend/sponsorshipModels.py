from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from db import Base


class SponsorshipApplication(Base):
    __tablename__ = "sponsorship_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    driver_id: Mapped[int] = mapped_column(Integer, nullable=False)
    sponsor_id: Mapped[int] = mapped_column(Integer, nullable=False)

    status: Mapped[str] = mapped_column(String(50), default="PENDING")

    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
