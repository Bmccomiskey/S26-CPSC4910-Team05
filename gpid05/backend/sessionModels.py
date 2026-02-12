from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import BigInteger, Integer, DateTime, ForeignKey, String
from db import Base

class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    last_activity_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    expires_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False)