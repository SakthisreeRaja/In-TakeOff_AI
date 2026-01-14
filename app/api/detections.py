from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services.detection_service import DetectionService

router = APIRouter(prefix="/detections", tags=["Detections"])

@router.get("/project/{project_id}")
def get_detections(project_id: str, db: Session = Depends(get_db)):
    return DetectionService(db).get_detections(project_id)

@router.post("/project/{project_id}/detect")
def run_detection(
    project_id: str,
    confidence_threshold: float = 0.15,
    db: Session = Depends(get_db),
):
    return DetectionService(db).run_detection(
        project_id, confidence_threshold
    )
