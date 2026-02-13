from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, field_validator


def _is_disallowed_manual_item(class_name: str) -> bool:
    normalized = class_name.lower().replace("_", "").replace("-", "").replace(" ", "")
    return normalized == "manualitem"

class DetectionCreate(BaseModel):
    project_id: str
    page_id: str = Field(..., description="UUID of the page") 
    class_name: str
    confidence: float
    bbox_x1: float
    bbox_y1: float
    bbox_x2: float
    bbox_y2: float
    notes: Optional[str] = None
    is_manual: bool = True 
    is_edited: bool = False

    @field_validator("class_name")
    @classmethod
    def validate_class_name(cls, value: str) -> str:
        if _is_disallowed_manual_item(value):
            raise ValueError("Manual_Item class is no longer supported.")
        return value

class DetectionUpdate(BaseModel):
    bbox_x1: Optional[float] = None
    bbox_y1: Optional[float] = None
    bbox_x2: Optional[float] = None
    bbox_y2: Optional[float] = None
    confidence: Optional[float] = None
    class_name: Optional[str] = None
    notes: Optional[str] = None
    is_edited: Optional[bool] = None

    @field_validator("class_name")
    @classmethod
    def validate_class_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if _is_disallowed_manual_item(value):
            raise ValueError("Manual_Item class is no longer supported.")
        return value

class DetectionResponse(BaseModel):
    id: str
    project_id: str
    page_id: str
    class_name: str
    confidence: float
    bbox_x1: float
    bbox_y1: float
    bbox_x2: float
    bbox_y2: float
    notes: Optional[str] = None
    is_manual: bool
    is_edited: bool
    created_at: datetime

    class Config:
        from_attributes = True

class BatchOperation(BaseModel):
    """Single operation in a batch sync"""
    operation: Literal["create", "update", "delete"]
    detection_id: Optional[str] = None  # Required for update/delete
    data: Optional[DetectionCreate] = None  # Required for create
    updates: Optional[DetectionUpdate] = None  # Required for update

class BatchSyncRequest(BaseModel):
    """Batch sync request for multiple detection operations"""
    page_id: str
    operations: List[BatchOperation]

class BatchSyncResponse(BaseModel):
    """Response from batch sync operation"""
    success: bool
    created_count: int
    updated_count: int
    deleted_count: int
    errors: List[str] = []
    detections: List[DetectionResponse]
