from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db
from app.schemas.detections import DetectionCreate, DetectionUpdate, DetectionResponse
from app.services.detection_service import DetectionService

router = APIRouter(prefix="/detections", tags=["Detections"])

@router.get("/project/{project_id}", response_model=List[DetectionResponse])
def get_project_detections(project_id: str, db: Session = Depends(get_db)):
    return DetectionService(db).get_project_detections(project_id)

@router.post("/", response_model=DetectionResponse)
def create_detection(payload: DetectionCreate, db: Session = Depends(get_db)):
    return DetectionService(db).create_detection(payload.model_dump())

@router.put("/{detection_id}", response_model=DetectionResponse)
def update_detection(detection_id: str, payload: DetectionUpdate, db: Session = Depends(get_db)):
    return DetectionService(db).update_detection(
        detection_id, payload.model_dump(exclude_unset=True)
    )

@router.delete("/{detection_id}")
def delete_detection(detection_id: str, db: Session = Depends(get_db)):
    DetectionService(db).delete_detection(detection_id)
    return {"status": "deleted"}
