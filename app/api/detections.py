from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services.detection_service import DetectionService
from app.schemas.detections import DetectionUpdate, DetectionCreate, DetectionResponse, DetectionRead
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/detections", tags=["Detections"])

class DetectionCreateNew(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    label: str
    confidence: float = 1.0
    is_manual: bool = True
    notes: str = ""

class DetectionUpdateNew(BaseModel):
    x1: float = None
    y1: float = None
    x2: float = None
    y2: float = None
    label: str = None
    confidence: float = None
    notes: str = None

@router.get("/project/{project_id}", response_model=List[DetectionResponse])
def get_detections(project_id: str, db: Session = Depends(get_db)):
    detections = DetectionService(db).get_detections(project_id)
    return detections

@router.post("/project/{project_id}/detect")
def run_detection(
    project_id: str,
    confidence_threshold: float = 0.15,
    db: Session = Depends(get_db),
):
    return DetectionService(db).run_detection(
        project_id, confidence_threshold
    )

@router.post("/project/{project_id}/detect-image", response_model=List[DetectionResponse])
async def run_detection_on_image(
    project_id: str,
    file: UploadFile = File(...),
    page_number: int = 1,
    db: Session = Depends(get_db)
):
    """
    Run AI detection on uploaded image using best.pt model
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read image data
    image_data = await file.read()
    
    detection_service = DetectionService(db)
    detections = detection_service.run_detection_and_save(image_data, project_id, page_number)
    return detections

@router.put("/detections/{detection_id}", response_model=DetectionResponse)
def update_detection_bbox(
    detection_id: str,
    bbox_data: DetectionUpdate,
    db: Session = Depends(get_db)
):
    """
    Update bounding box coordinates for a specific detection
    """
    detection_service = DetectionService(db)
    try:
        updated_detection = detection_service.update_detection_bbox(
            detection_id, 
            bbox_data.model_dump(exclude_unset=True)
        )
        return updated_detection
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/detections/{detection_id}")
def delete_detection(
    detection_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a specific detection
    """
    detection_service = DetectionService(db)
    success = detection_service.delete_detection(detection_id)
    if not success:
        raise HTTPException(status_code=404, detail="Detection not found")
    return {"message": "Detection deleted successfully"}

@router.post("/detections", response_model=DetectionResponse)
def create_detection(
    detection_data: DetectionCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new detection (manual annotation)
    """
    detection_service = DetectionService(db)
    new_detection = detection_service.add_new_detection(detection_data.model_dump())
    return new_detection

# New Cloudinary-compatible endpoints
@router.get("/pages/{page_id}")
def get_page_detections(page_id: str, db: Session = Depends(get_db)):
    """Get all bounding boxes for a page"""
    return DetectionService(db).get_page_detections(page_id)

@router.post("/pages/{page_id}")
def add_detection_to_page(page_id: str, detection: DetectionCreateNew, db: Session = Depends(get_db)):
    """Add new bounding box to a specific page"""
    return DetectionService(db).add_detection_to_page(page_id, detection.dict())

@router.put("/{detection_id}")
def update_detection_coordinates(detection_id: str, detection: DetectionUpdateNew, db: Session = Depends(get_db)):
    """Update bounding box position/size"""
    update_data = {k: v for k, v in detection.dict().items() if v is not None}
    return DetectionService(db).update_detection_coords(detection_id, update_data)

@router.delete("/{detection_id}")
def delete_detection_by_id(detection_id: str, db: Session = Depends(get_db)):
    """Delete bounding box"""
    success = DetectionService(db).delete_detection(detection_id)
    if not success:
        raise HTTPException(status_code=404, detail="Detection not found")
    return {"message": "Detection deleted successfully"}
