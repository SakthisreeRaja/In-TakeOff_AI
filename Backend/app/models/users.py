import uuid
from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String, unique=True)
    first_name: Mapped[str] = mapped_column(String)
    last_name: Mapped[str] = mapped_column(String)
    profile_image_url: Mapped[str] = mapped_column(String, nullable=True, default="")
    role: Mapped[str] = mapped_column(String, default="estimator")
    company: Mapped[str] = mapped_column(String, nullable=True, default="")
    phone: Mapped[str] = mapped_column(String, nullable=True, default="")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    projects = relationship("Project", back_populates="user")
    team_memberships = relationship("TeamMember", back_populates="user")
    owned_teams = relationship("Team", back_populates="owner")
