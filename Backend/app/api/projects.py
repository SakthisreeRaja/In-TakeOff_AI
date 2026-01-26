from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.projects import ProjectCreate, ProjectRead
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["Projects"])

# 🔥 FIX: Add user_id as a required query parameter
@router.get("/", response_model=list[ProjectRead])
def list_projects(
    user_id: str = Query(..., description="The ID of the user to filter projects by"), 
    db: Session = Depends(get_db)
):
    # Now we pass the user_id to the service to enforce filtering
    return ProjectService(db).list_projects(user_id)

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

@router.get("/{project_id}/pages")
def get_project_pages(project_id: str, db: Session = Depends(get_db)):
    """Get all pages and bounding boxes for a project"""
    from app.services.pdf_service import PDFService
    return PDFService(db).get_project_pages(project_id)

@router.post("/{project_id}/upload")
async def upload_pdf(
    project_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload PDF and convert to images stored in Cloudinary"""
    # ... (Same logic as before, just ensuring imports match if you copy-paste the whole file)
    from app.services.pdf_service import PDFService
    
    # Check if project already has pages (re-importing Page to avoid circular deps if needed)
    # But strictly for this file, you can just call the service:
    return await PDFService(db).upload_and_convert(project_id, file)

# (Note: For the upload_pdf route above, I abbreviated the imports for clarity. 
# If you didn't change imports, the previous `uploads.py` logic was fine. 
# The MAIN FIX is the `list_projects` function at the top.)