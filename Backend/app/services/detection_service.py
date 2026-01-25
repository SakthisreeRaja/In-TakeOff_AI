import uuid
from typing import Dict, List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.detections import Detection
from app.models.pages import Page
from app.services.base import BaseService

class DetectionService(BaseService):

    def _get_page(self, page_id: str) -> Page:
        page = self.db.query(Page).filter(Page.id == page_id).first()
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")
        return page

    # 🔥 NEW METHOD REQUIRED BY API
    def get_detections_by_page(self, page_id: str):
        return (
            self.db.query(Detection)
            .filter(Detection.page_id == page_id)
            .all()
        )

    def create_detection(self, data: Dict):
        # Verify page exists
        self._get_page(data["page_id"])

        detection = Detection(
            id=str(uuid.uuid4()),
            project_id=data["project_id"],
            page_id=data["page_id"],
            class_name=data["class_name"],
            confidence=data["confidence"],
            bbox_x1=data["bbox_x1"],
            bbox_y1=data["bbox_y1"],
            bbox_x2=data["bbox_x2"],
            bbox_y2=data["bbox_y2"],
            notes=data.get("notes"),
            is_manual=data.get("is_manual", True),
        )

        self.db.add(detection)
        self.db.commit()
        self.db.refresh(detection)
        return detection

    def update_detection(self, detection_id: str, updates: Dict):
        detection = self.db.query(Detection).filter(Detection.id == detection_id).first()
        if not detection:
            raise HTTPException(status_code=404, detail="Detection not found")

        for k, v in updates.items():
            setattr(detection, k, v)

        self.db.commit()
        self.db.refresh(detection)
        return detection

    def delete_detection(self, detection_id: str):
        detection = self.db.query(Detection).filter(Detection.id == detection_id).first()
        if not detection:
            raise HTTPException(status_code=404, detail="Detection not found")

        self.db.delete(detection)
        self.db.commit()