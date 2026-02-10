import uuid
from typing import Dict, List, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.detections import Detection
from app.models.pages import Page
from app.services.base import BaseService
import requests
from PIL import Image
from io import BytesIO

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
            is_edited=data.get("is_edited", False),
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

    async def run_detection_for_page(self, page_id: str):
        """Run AI detection on a specific page"""
        page = self._get_page(page_id)
        
        # Download the image from Cloudinary
        try:
            response = requests.get(page.image_url)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load image: {str(e)}")
        
        # Import PDFService to use its generate_detections method
        from app.services.pdf_service import PDFService
        pdf_service = PDFService(self.db)
        
        # Run detection
        bounding_boxes = pdf_service.generate_detections(page_id, page.project_id, image)
        
        # Commit the detections
        self.db.commit()
        
        return {
            "message": "Detection completed",
            "page_id": page_id,
            "detections_count": len(bounding_boxes),
            "detections": bounding_boxes
        }

    async def batch_sync(self, page_id: str, operations: List[Any]):
        """Batch process multiple detection operations"""
        # Verify page exists
        self._get_page(page_id)
        
        created_count = 0
        updated_count = 0
        deleted_count = 0
        errors = []
        
        try:
            for op in operations:
                try:
                    if op.operation == "create":
                        if op.data:
                            data = op.data.model_dump()
                            data['page_id'] = page_id
                            self.create_detection(data)
                            created_count += 1
                    
                    elif op.operation == "update":
                        if op.detection_id and op.updates:
                            self.update_detection(
                                op.detection_id,
                                op.updates.model_dump(exclude_unset=True)
                            )
                            updated_count += 1
                    
                    elif op.operation == "delete":
                        if op.detection_id:
                            self.delete_detection(op.detection_id)
                            deleted_count += 1
                            
                except Exception as e:
                    errors.append(f"Operation {op.operation} failed: {str(e)}")
            
            # Get all detections for this page after operations
            detections = self.get_detections_by_page(page_id)
            
            return {
                "success": len(errors) == 0,
                "created_count": created_count,
                "updated_count": updated_count,
                "deleted_count": deleted_count,
                "errors": errors,
                "detections": detections
            }
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Batch sync failed: {str(e)}")
