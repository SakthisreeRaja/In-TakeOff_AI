import uuid
import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Integer,
    Text,
    ForeignKey,
    Enum,
    DateTime,
    Numeric,
    UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


# ==============================
# ENUMS
# ==============================

class OrientationEnum(str, enum.Enum):
    deg_0 = "0_deg"
    deg_90 = "90_deg"
    deg_180 = "180_deg"
    deg_270 = "270_deg"


# ==============================
# MATERIAL
# ==============================

class Material(Base):
    __tablename__ = "materials"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)


# ==============================
# MANUFACTURER
# ==============================

class Manufacturer(Base):
    __tablename__ = "manufacturers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(150), unique=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    models = relationship("Model", back_populates="manufacturer", cascade="all, delete")


# ==============================
# MODEL
# ==============================

class Model(Base):
    __tablename__ = "models"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    manufacturer_id = Column(
        String,
        ForeignKey("manufacturers.id", ondelete="CASCADE"),
        nullable=False
    )

    model_number = Column(String(150), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    manufacturer = relationship("Manufacturer", back_populates="models")

    __table_args__ = (
        UniqueConstraint("manufacturer_id", "model_number", name="uq_model_per_manufacturer"),
    )


# ==============================
# HVAC COMPONENT (MAIN TABLE)
# ==============================

class HVACComponent(Base):
    __tablename__ = "hvac_components"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # 🔗 REQUIRED RELATIONS
    project_id = Column(
        String,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    detection_id = Column(
        String,
        ForeignKey("detections.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # 1 detection → 1 hvac property
        index=True
    )

    created_by = Column(
        String,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    # =====================
    # BASIC INFO
    # =====================

    name = Column(String(150), nullable=False)      # Supply Diffuser
    category = Column(String(100), nullable=False)  # Air Terminal
    class_name = Column(String(100), nullable=False)  # From detection

    quantity = Column(Integer, default=1)

    # =====================
    # DIMENSIONS
    # =====================

    neck_size = Column(String(50))   # 12"x12"
    face_size = Column(String(50))   # 24"x24"
    inlet_size = Column(String(50))  # 10" dia

    # =====================
    # SPECIFICATIONS
    # =====================

    cfm = Column(Integer)
    orientation = Column(String(20), default="0_deg")
    tag = Column(String(100))  # Tag for each HVAC component

    # =====================
    # MATERIAL & MODEL
    # =====================

    material_id = Column(String, ForeignKey("materials.id"))
    manufacturer_id = Column(String, ForeignKey("manufacturers.id"))
    model_id = Column(String, ForeignKey("models.id"))

    # =====================
    # BOQ / EXPORT SUPPORT
    # =====================

    unit_cost = Column(Numeric(12, 2))
    total_cost = Column(Numeric(14, 2))
    boq_code = Column(String(100))
    section = Column(String(100))

    specification_note = Column(Text)

    # =====================
    # AUDIT
    # =====================

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # =====================
    # RELATIONSHIPS
    # =====================

    material = relationship("Material")
    manufacturer = relationship("Manufacturer")
    model = relationship("Model")
