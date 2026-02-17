from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal


# ==============================
# MATERIAL SCHEMAS
# ==============================

class MaterialBase(BaseModel):
    name: str = Field(..., max_length=100, description="Material name")


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)


class MaterialResponse(MaterialBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    created_at: datetime


# ==============================
# MANUFACTURER SCHEMAS
# ==============================

class ManufacturerBase(BaseModel):
    name: str = Field(..., max_length=150, description="Manufacturer name")


class ManufacturerCreate(ManufacturerBase):
    pass


class ManufacturerUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=150)


class ManufacturerResponse(ManufacturerBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    created_at: datetime


# ==============================
# MODEL SCHEMAS
# ==============================

class ModelBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    manufacturer_id: str
    model_number: str = Field(..., max_length=150)


class ModelCreate(ModelBase):
    pass


class ModelUpdate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    manufacturer_id: Optional[str] = None
    model_number: Optional[str] = Field(None, max_length=150)


class ModelResponse(ModelBase):
    model_config = ConfigDict(protected_namespaces=(), from_attributes=True)
    
    id: str
    created_at: datetime
    manufacturer: Optional[ManufacturerResponse] = None


# ==============================
# HVAC COMPONENT SCHEMAS
# ==============================

class HVACComponentBase(BaseModel):
    name: str = Field(..., max_length=150, description="Component name")
    category: str = Field(..., max_length=100, description="Component category")
    class_name: str = Field(..., max_length=100, description="Detection class name")
    quantity: int = Field(default=1, ge=1)
    
    # Dimensions
    neck_size: Optional[str] = Field(None, max_length=50)
    face_size: Optional[str] = Field(None, max_length=50)
    inlet_size: Optional[str] = Field(None, max_length=50)
    
    # Specifications
    cfm: Optional[int] = Field(None, ge=0)
    orientation: Optional[str] = Field(None, description="Orientation: 0_deg, 90_deg, 180_deg, 270_deg")
    tag: Optional[str] = Field(None, max_length=100, description="Tag for HVAC component")
    
    # BOQ fields
    unit_cost: Optional[Decimal] = Field(None, ge=0)
    total_cost: Optional[Decimal] = Field(None, ge=0)
    boq_code: Optional[str] = Field(None, max_length=100)
    section: Optional[str] = Field(None, max_length=100)
    specification_note: Optional[str] = None


class HVACComponentCreate(HVACComponentBase):
    model_config = ConfigDict(protected_namespaces=())
    
    project_id: str
    detection_id: str
    created_by: Optional[str] = None
    material_id: Optional[str] = None
    manufacturer_id: Optional[str] = None
    model_id: Optional[str] = None


class HVACComponentUpdate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    name: Optional[str] = Field(None, max_length=150)
    category: Optional[str] = Field(None, max_length=100)
    class_name: Optional[str] = Field(None, max_length=100)
    quantity: Optional[int] = Field(None, ge=1)
    
    # Dimensions
    neck_size: Optional[str] = Field(None, max_length=50)
    face_size: Optional[str] = Field(None, max_length=50)
    inlet_size: Optional[str] = Field(None, max_length=50)
    
    # Specifications
    cfm: Optional[int] = Field(None, ge=0)
    orientation: Optional[str] = None
    tag: Optional[str] = Field(None, max_length=100)
    
    # Relations
    material_id: Optional[str] = None
    manufacturer_id: Optional[str] = None
    model_id: Optional[str] = None
    
    # BOQ fields
    unit_cost: Optional[Decimal] = Field(None, ge=0)
    total_cost: Optional[Decimal] = Field(None, ge=0)
    boq_code: Optional[str] = Field(None, max_length=100)
    section: Optional[str] = Field(None, max_length=100)
    specification_note: Optional[str] = None


class HVACComponentResponse(HVACComponentBase):
    model_config = ConfigDict(protected_namespaces=(), from_attributes=True)
    
    id: str
    project_id: str
    detection_id: str
    created_by: Optional[str] = None
    
    material_id: Optional[str] = None
    manufacturer_id: Optional[str] = None
    model_id: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    
    # Nested relationships (optional, can be loaded)
    material: Optional[MaterialResponse] = None
    manufacturer: Optional[ManufacturerResponse] = None
    model: Optional[ModelResponse] = None


# ==============================
# BULK OPERATIONS
# ==============================

class HVACComponentBulkCreate(BaseModel):
    components: list[HVACComponentCreate]


class HVACComponentBulkResponse(BaseModel):
    created: list[HVACComponentResponse]
    failed: list[dict]
