from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.pdf_service import PDFService

router = APIRouter(prefix="/projects", tags=["Uploads"])

@router.post("/{project_id}/upload")
async def upload_pdf(
    project_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    return await PDFService(db).upload_and_convert(project_id, file)
