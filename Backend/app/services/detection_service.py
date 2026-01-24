from app.services.base import BaseService
from app.models.detections import Detection
from app.models.pages import Page
from sqlalchemy import asc
from typing import Dict, List
from ultralytics import YOLO
from PIL import Image
from fastapi import HTTPException
import io
import os
import uuid
import torch

class ModelInferenceService:
    def __init__(self):
        # Monkey-patch torch.load to use weights_only=False for trusted model files
        # This is needed for PyTorch 2.6 compatibility with ultralytics models
        original_load = torch.load
        def patched_load(*args, **kwargs):
            kwargs.setdefault('weights_only', False)
            return original_load(*args, **kwargs)
        torch.load = patched_load
        
        # Load your best.pt model
        model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "best.pt")
        self.model = YOLO(model_path)
        
        # Restore original torch.load
        torch.load = original_load
    
    def run_detection(self, image_data: bytes, project_id: str, page_number: int = 1) -> List[Dict]:
        """
        Run inference on image and return detection data ready for database
        """
        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_data))
            
            # Run inference
            results = self.model(image)
            
            # Process results into your database format
            detections = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Convert from center format to corner format
                        x_center, y_center, width, height = box.xywh[0].tolist()
                        x1 = x_center - width / 2
                        y1 = y_center - height / 2
                        x2 = x_center + width / 2
                        y2 = y_center + height / 2
                        
                        detection_data = {
                            "project_id": project_id,
                            "page_number": page_number,
                            "class_name": self.model.names[int(box.cls[0])],
                            "confidence": float(box.conf[0]),
                            "bbox_x1": float(x1),
                            "bbox_y1": float(y1),
                            "bbox_x2": float(x2),
                            "bbox_y2": float(y2),
                            "is_manual": False
                        }
                        detections.append(detection_data)
            
            return detections
            
        except Exception as e:
            print(f"Detection error: {str(e)}")
            return []

# Singleton instance
model_inference = ModelInferenceService()

class DetectionService(BaseService):

    def get_detections(self, project_id: str):
        return (
            self.db.query(Detection)
            .filter(Detection.project_id == project_id)
            .order_by(Detection.page_number, Detection.class_name)
            .all()
        )

    def create_detections(self, detections: list[dict]):
        if not detections:
            return []

        objs = [Detection(**d) for d in detections]
        self.db.add_all(objs)
        self.db.commit()
        return objs

    def delete_detections(self, project_id: str):
        self.db.query(Detection).filter(
            Detection.project_id == project_id
        ).delete()
        self.db.commit()
    
    def run_detection(self, project_id: str, confidence_threshold: float = 0.15):
        """
        Run AI detection using best.pt model and save results
        """
        # This method can be implemented based on your existing flow
        # For now, return a placeholder that can be updated with actual image data
        return {"message": "Detection endpoint ready for integration with best.pt model"}
    
    def run_detection_and_save(self, image_data: bytes, project_id: str, page_number: int = 1):
        """
        Run AI detection on image and save results to database
        """
        # Run model inference
        detections_data = model_inference.run_detection(image_data, project_id, page_number)
        
        # Save to database
        if detections_data:
            return self.create_detections(detections_data)
        return []
    
    def update_detection_bbox(self, detection_id: str, bbox_data: Dict) -> Detection:
        """
        Update bounding box coordinates for a detection
        """
        detection = self.db.query(Detection).filter(Detection.id == detection_id).first()
        if not detection:
            raise ValueError(f"Detection with ID {detection_id} not found")
        
        # Update bounding box coordinates
        if "bbox_x1" in bbox_data:
            detection.bbox_x1 = bbox_data["bbox_x1"]
        if "bbox_y1" in bbox_data:
            detection.bbox_y1 = bbox_data["bbox_y1"]
        if "bbox_x2" in bbox_data:
            detection.bbox_x2 = bbox_data["bbox_x2"]
        if "bbox_y2" in bbox_data:
            detection.bbox_y2 = bbox_data["bbox_y2"]
        if "confidence" in bbox_data:
            detection.confidence = bbox_data["confidence"]
        if "class_name" in bbox_data:
            detection.class_name = bbox_data["class_name"]
        if "notes" in bbox_data:
            detection.notes = bbox_data["notes"]
        
        self.db.commit()
        self.db.refresh(detection)
        return detection
    
    def delete_detection(self, detection_id: str):
        """
        Delete a specific detection
        """
        detection = self.db.query(Detection).filter(Detection.id == detection_id).first()
        if detection:
            self.db.delete(detection)
            self.db.commit()
            return True
        return False
    
    def add_new_detection(self, detection_data: Dict) -> Detection:
        """
        Add a new detection (manual annotation)
        """
        detection = Detection(**detection_data)
        self.db.add(detection)
        self.db.commit()
        self.db.refresh(detection)
        return detection

    # New Cloudinary-compatible methods
    def get_page_detections(self, page_id: str):
        """Get all bounding boxes for a page"""
        detections = self.db.query(Detection).filter(Detection.page_id == page_id).all()
        return [
            {
                "id": d.id,
                "x1": d.bbox_x1,
                "y1": d.bbox_y1,
                "x2": d.bbox_x2,
                "y2": d.bbox_y2,
                "width": d.bbox_x2 - d.bbox_x1,
                "height": d.bbox_y2 - d.bbox_y1,
                "label": d.class_name,
                "confidence": d.confidence,
                "is_manual": d.is_manual
            }
            for d in detections
        ]
    
    def add_detection_to_page(self, page_id: str, detection_data: dict):
        """Add new bounding box to specific page"""
        # Get page to validate and get project_id
        page = self.db.query(Page).filter(Page.id == page_id).first()
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")
        
        detection = Detection(
            id=str(uuid.uuid4()),
            page_id=page_id,
            project_id=page.project_id,
            class_name=detection_data["label"],
            confidence=detection_data.get("confidence", 1.0),
            bbox_x1=detection_data["x1"],
            bbox_y1=detection_data["y1"],
            bbox_x2=detection_data["x2"],
            bbox_y2=detection_data["y2"],
            is_manual=detection_data.get("is_manual", True),
            notes=detection_data.get("notes", "")
        )
        self.db.add(detection)
        self.db.commit()
        self.db.refresh(detection)
        return {
            "id": detection.id,
            "x1": detection.bbox_x1,
            "y1": detection.bbox_y1,
            "x2": detection.bbox_x2,
            "y2": detection.bbox_y2,
            "width": detection.bbox_x2 - detection.bbox_x1,
            "height": detection.bbox_y2 - detection.bbox_y1,
            "label": detection.class_name,
            "confidence": detection.confidence,
            "is_manual": detection.is_manual
        }
    
    def update_detection_coords(self, detection_id: str, update_data: dict):
        """Update existing bounding box coordinates and properties"""
        detection = self.db.query(Detection).filter(Detection.id == detection_id).first()
        if not detection:
            raise HTTPException(status_code=404, detail="Detection not found")
        
        # Update fields
        if "x1" in update_data:
            detection.bbox_x1 = update_data["x1"]
        if "y1" in update_data:
            detection.bbox_y1 = update_data["y1"]
        if "x2" in update_data:
            detection.bbox_x2 = update_data["x2"]
        if "y2" in update_data:
            detection.bbox_y2 = update_data["y2"]
        if "label" in update_data:
            detection.class_name = update_data["label"]
        if "confidence" in update_data:
            detection.confidence = update_data["confidence"]
        if "notes" in update_data:
            detection.notes = update_data["notes"]
        
        self.db.commit()
        self.db.refresh(detection)
        return {
            "id": detection.id,
            "x1": detection.bbox_x1,
            "y1": detection.bbox_y1,
            "x2": detection.bbox_x2,
            "y2": detection.bbox_y2,
            "width": detection.bbox_x2 - detection.bbox_x1,
            "height": detection.bbox_y2 - detection.bbox_y1,
            "label": detection.class_name,
            "confidence": detection.confidence,
            "is_manual": detection.is_manual
        }
