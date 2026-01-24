from app.schemas.common import ORMBase
from datetime import datetime

class BoqExportCreate(ORMBase):
    project_id: str
    format: str

class BoqExportRead(ORMBase):
    id: str
    file_url: str | None
    created_at: datetime
