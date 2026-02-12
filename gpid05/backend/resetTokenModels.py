from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from db import Base


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id         : Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    user_id    : Mapped[int]      = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    token      : Mapped[str]      = mapped_column(String(255), unique=True, nullable=False, index=True)
    expires_at : Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used       : Mapped[bool]     = mapped_column(Boolean, default=False)
    created_at : Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reset_tokens")