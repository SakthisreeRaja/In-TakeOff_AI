from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.projects import ProjectCreate, ProjectRead
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("/", response_model=list[ProjectRead])
def list_projects(db: Session = Depends(get_db)):
    return ProjectService(db).list_projects()

@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = ProjectService(db).get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/", response_model=ProjectRead, status_code=201)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
):
    return ProjectService(db).create_project(payload)

@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: str,
    payload: dict,
    db: Session = Depends(get_db),
):
    project = ProjectService(db).update_project(project_id, payload)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    ProjectService(db).delete_project(project_id)
