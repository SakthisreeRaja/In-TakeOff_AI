from app.schemas.common import ORMBase
from datetime import datetime
from app.models.enums import ProjectStatus

class ProjectBase(ORMBase):
    name: str
    description: str | None = None
    confidence_threshold: float = 0.15

class ProjectCreate(ProjectBase):
    user_id: str
    team_id: str | None = None

class ProjectRead(ProjectBase):
    id: str
    status: ProjectStatus
    page_count: int
    total_detections: int
    created_at: datetime
