from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db
from app.schemas.detections import (
    DetectionCreate, 
    DetectionUpdate, 
    DetectionResponse, 
    BatchSyncRequest, 
    BatchSyncResponse
)
from app.services.detection_service import DetectionService

router = APIRouter(prefix="/detections", tags=["Detections"])

# ✅ MATCHES FRONTEND: getPageDetections(pageId) -> GET /api/detections/pages/{pageId}
@router.get("/pages/{page_id}", response_model=List[DetectionResponse])
def get_page_detections(page_id: str, db: Session = Depends(get_db)):
    return DetectionService(db).get_detections_by_page(page_id)

# ✅ MATCHES FRONTEND: createDetection(pageId, data) -> POST /api/detections/pages/{pageId}
@router.post("/pages/{page_id}", response_model=DetectionResponse)
def create_detection(page_id: str, payload: DetectionCreate, db: Session = Depends(get_db)):
    # Ensure the page_id in the URL is used
    data = payload.model_dump()
    data['page_id'] = page_id
    return DetectionService(db).create_detection(data)

# ✅ MATCHES FRONTEND: updateDetection(id, data) -> PUT /api/detections/{id}
@router.put("/{detection_id}", response_model=DetectionResponse)
def update_detection(detection_id: str, payload: DetectionUpdate, db: Session = Depends(get_db)):
    return DetectionService(db).update_detection(
        detection_id, payload.model_dump(exclude_unset=True)
    )

# ✅ MATCHES FRONTEND: deleteDetection(id) -> DELETE /api/detections/{id}
@router.delete("/{detection_id}")
def delete_detection(detection_id: str, db: Session = Depends(get_db)):
    DetectionService(db).delete_detection(detection_id)
    return {"status": "deleted"}

# 🔥 NEW: Run detection on a specific page
@router.post("/run/{page_id}")
async def run_detection_on_page(page_id: str, db: Session = Depends(get_db)):
    """Run AI detection on a specific page"""
    return await DetectionService(db).run_detection_for_page(page_id)

# 🔥 NEW: Batch sync endpoint for efficient syncing
@router.post("/batch-sync", response_model=BatchSyncResponse)
async def batch_sync_detections(payload: BatchSyncRequest, db: Session = Depends(get_db)):
    """Batch sync multiple detection operations in one request"""
    return await DetectionService(db).batch_sync(payload.page_id, payload.operations)