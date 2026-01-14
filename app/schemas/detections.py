from app.schemas.common import ORMBase
from datetime import datetime

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
