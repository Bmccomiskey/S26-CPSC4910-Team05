from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from db import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id:        Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    phone:          Mapped[str|None] = mapped_column(String(50),  nullable=True)
    # Driver fields
    first_name:     Mapped[str|None] = mapped_column(String(100), nullable=True)
    last_name:      Mapped[str|None] = mapped_column(String(100), nullable=True)
    city:           Mapped[str|None] = mapped_column(String(100), nullable=True)
    state:          Mapped[str|None] = mapped_column(String(50),  nullable=True)
    cdl_number:     Mapped[str|None] = mapped_column(String(50),  nullable=True)
    cdl_class:      Mapped[str|None] = mapped_column(String(20),  nullable=True)
    years_exp:      Mapped[str|None] = mapped_column(String(10),  nullable=True)
    # Sponsor fields
    company_name:   Mapped[str|None] = mapped_column(String(150), nullable=True)
    contact_name:   Mapped[str|None] = mapped_column(String(100), nullable=True)
    website:        Mapped[str|None] = mapped_column(String(200), nullable=True)
    address:        Mapped[str|None] = mapped_column(String(255), nullable=True)
    industry:       Mapped[str|None] = mapped_column(String(100), nullable=True)
    point_budget:   Mapped[str|None] = mapped_column(String(20),  nullable=True)
    min_point_cost: Mapped[str|None] = mapped_column(String(20),  nullable=True)
    max_point_cost: Mapped[str|None] = mapped_column(String(20),  nullable=True)
