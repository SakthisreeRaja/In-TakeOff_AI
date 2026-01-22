from app.schemas.common import ORMBase
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class DetectionBase(ORMBase):
    class_name: str
    confidence: float
    bbox_x1: float
    bbox_y1: float
    bbox_x2: float
    bbox_y2: float
    notes: str | None = None
    is_manual: bool = False

class DetectionCreate(DetectionBase):
    project_id: str
    page_number: int

class DetectionRead(DetectionBase):
    id: str
    created_at: datetime

class DetectionUpdate(BaseModel):
    bbox_x1: Optional[float] = None
    bbox_y1: Optional[float] = None
    bbox_x2: Optional[float] = None
    bbox_y2: Optional[float] = None
    confidence: Optional[float] = None
    class_name: Optional[str] = None
    notes: Optional[str] = None

class DetectionResponse(BaseModel):
    id: str
    project_id: str
    page_number: int
    class_name: str
    confidence: float
    bbox_x1: float
    bbox_y1: float
    bbox_x2: float
    bbox_y2: float
    notes: str | None = None
    is_manual: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
