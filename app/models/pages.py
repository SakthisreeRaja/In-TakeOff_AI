import uuid
from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Page(Base):
    __tablename__ = "pages"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"))
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Cloud storage fields
    image_url: Mapped[str] = mapped_column(String, nullable=False)
    cloudinary_public_id: Mapped[str] = mapped_column(String, nullable=False)
    
    # Image dimensions for bounding box calculations
    width: Mapped[int] = mapped_column(Integer, default=0)
    height: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="pages")
    detections = relationship("Detection", back_populates="page", cascade="all, delete-orphan")