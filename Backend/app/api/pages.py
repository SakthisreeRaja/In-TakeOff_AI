from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["Pages"])

@router.get("/{project_id}/pages")
def get_pages(project_id: str, db: Session = Depends(get_db)):
    return ProjectService(db).get_pages(project_id)
