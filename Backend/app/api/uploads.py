from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.api.deps import get_db
from app.services.pdf_service import PDFService
from app.services.cloudinary_service import CloudinaryService

router = APIRouter(prefix="/projects", tags=["Uploads"])

@router.post("/{project_id}/upload")
async def upload_pdf(
    project_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload PDF and convert to images stored in Cloudinary"""
    # Check if project already has pages
    from app.models.pages import Page
    existing_pages = db.query(Page).filter(Page.project_id == project_id).first()
    if existing_pages:
        # Return existing pages instead of re-processing
        return PDFService(db).get_project_pages(project_id)
    
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    # Check file size (max 25MB)
    await file.seek(0)
    file_content = await file.read()
    if len(file_content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size too large. Max 25MB allowed")
    
    # Reset file pointer
    await file.seek(0)
    
    return await PDFService(db).upload_and_convert(project_id, file)

# Additional Cloudinary endpoints
@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """Direct image upload to Cloudinary"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    
    try:
        file_content = await file.read()
        filename = f"{uuid.uuid4()}_{file.filename}"
        
        upload_result = CloudinaryService.upload_image(file_content, filename)
        
        return {
            "message": "Image uploaded successfully",
            "file_url": upload_result["url"],
            "filename": filename,
            "file_size": upload_result["file_size"],
            "public_id": upload_result["public_id"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.delete("/file/{public_id}")
async def delete_file(public_id: str, resource_type: str = "image"):
    """Delete file from Cloudinary"""
    try:
        # Remove the resource_type prefix from public_id if present
        clean_public_id = public_id.replace("images/", "").replace("pdfs/", "")
        success = CloudinaryService.delete_file(clean_public_id, resource_type)
        if success:
            return {"message": "File deleted successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to delete file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
