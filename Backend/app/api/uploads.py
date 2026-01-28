from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from typing import List
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

@router.post("/{project_id}/upload-pages")
async def upload_pre_converted_pages(
    project_id: str,
    db: Session = Depends(get_db),
    page_count: int = Form(...),
    page_1: UploadFile = File(None),
    page_2: UploadFile = File(None),
    page_3: UploadFile = File(None),
    page_4: UploadFile = File(None),
    page_5: UploadFile = File(None),
    page_6: UploadFile = File(None),
    page_7: UploadFile = File(None),
    page_8: UploadFile = File(None),
    page_9: UploadFile = File(None),
    page_10: UploadFile = File(None),
):
    """
    Upload pre-converted page images from client-side PDF processing
    This allows instant preview in browser while backend uploads to Cloudinary
    """
    pages = [page_1, page_2, page_3, page_4, page_5, page_6, page_7, page_8, page_9, page_10]
    page_files = [p for p in pages[:page_count] if p is not None]
    
    if len(page_files) != page_count:
        raise HTTPException(status_code=400, detail=f"Expected {page_count} pages but received {len(page_files)}")
    
    return await PDFService(db).upload_pre_converted_pages(project_id, page_files)

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
