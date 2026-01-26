from pydantic import EmailStr
from app.schemas.common import ORMBase
from datetime import datetime

class UserBase(ORMBase):
    email: EmailStr
    first_name: str
    last_name: str
    profile_image_url: str | None = None
    role: str = "estimator"

class UserCreate(UserBase):
    id: str | None = None

class UserRead(UserBase):
    id: str
    created_at: datetime
