from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from db import Base


class VersionInfo(Base):
    __tablename__ = "Version_Info"

    TeamNum: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    VerNum: Mapped[int] = mapped_column(Integer, nullable=False)
    Updated: Mapped[DateTime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
