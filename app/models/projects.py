import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.enums import ProjectStatus

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    team_id: Mapped[str] = mapped_column(ForeignKey("teams.id"), nullable=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String)
    pdf_url: Mapped[str] = mapped_column(String, nullable=True, default="")
    thumbnail_url: Mapped[str] = mapped_column(String, nullable=True, default="")

    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus), default=ProjectStatus.draft
    )

    page_count: Mapped[int] = mapped_column(Integer, default=0)
    total_detections: Mapped[int] = mapped_column(Integer, default=0)
    confidence_threshold: Mapped[float] = mapped_column(Float, default=0.15)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    pages = relationship("Page", back_populates="project", cascade="all, delete-orphan")
    detections = relationship("Detection", back_populates="project")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="projects")
    team = relationship("Team", back_populates="projects")
    detections = relationship("Detection", back_populates="project")
