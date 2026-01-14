from app.schemas.common import ORMBase
from datetime import datetime

class TeamBase(ORMBase):
    name: str

class TeamCreate(TeamBase):
    owner_id: str

class TeamRead(TeamBase):
    id: str
    created_at: datetime
