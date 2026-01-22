import os
import io
import uuid
from fastapi import UploadFile, HTTPException
from pdf2image import convert_from_bytes

from app.services.base import BaseService
from app.services.cloudinary_service import CloudinaryService
from app.models.projects import Project
from app.models.pages import Page
from app.models.detections import Detection

UPLOAD_ROOT = "uploads"

class PDFService(BaseService):

    async def upload_and_convert(
        self,
        project_id: str,
        file: UploadFile,
    ):
        project = (
            self.db.query(Project)
            .filter(Project.id == project_id)
            .first()
        )
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        pdf_bytes = await file.read()

        # 🔥 Convert PDF → PNG and upload to Cloudinary
        images = convert_from_bytes(
            pdf_bytes,
            dpi=300,       # IMPORTANT for HVAC drawings
            fmt="png",
        )

        page_data = []
        
        # Upload each page to Cloudinary and create page records
        for i, image in enumerate(images, start=1):
            # Convert PIL image to bytes
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format='PNG')
            img_byte_arr.seek(0)
            
            # Upload to Cloudinary
            filename = f"{project_id}_page_{i}"
            upload_result = CloudinaryService.upload_image(
                img_byte_arr.getvalue(), 
                filename
            )
            
            # Create page record in database
            page = Page(
                id=str(uuid.uuid4()),
                project_id=project_id,
                page_number=i,
                image_url=upload_result["url"],
                cloudinary_public_id=upload_result["public_id"],
                width=image.width,
                height=image.height
            )
            self.db.add(page)
            
            # Generate initial bounding boxes (mock AI detection)
            bounding_boxes = self.generate_mock_detections(page.id, project_id, image.width, image.height)
            
            page_data.append({
                "page_id": page.id,
                "page_number": i,
                "image_url": upload_result["url"],
                "width": image.width,
                "height": image.height,
                "bounding_boxes": bounding_boxes
            })

        # Update project
        project.page_count = len(images)
        if page_data:
            project.pdf_url = page_data[0]["image_url"]  # First page as thumbnail
        self.db.commit()

        return {
            "message": "PDF uploaded and converted successfully",
            "pages": page_data,
            "pageCount": len(images),
        }

    def generate_mock_detections(self, page_id: str, project_id: str, image_width: int, image_height: int):
        """Generate mock HVAC component detections with bounding boxes"""
        mock_detections = [
            {"x1": 100, "y1": 150, "x2": 180, "y2": 210, "label": "Duct", "confidence": 0.85},
            {"x1": 250, "y1": 200, "x2": 370, "y2": 280, "label": "AC Unit", "confidence": 0.92},
            {"x1": 400, "y1": 100, "x2": 460, "y2": 160, "label": "Vent", "confidence": 0.78},
            {"x1": 150, "y1": 300, "x2": 220, "y2": 350, "label": "Damper", "confidence": 0.73},
        ]
        
        bounding_boxes = []
        for detection in mock_detections:
            # Ensure coordinates are within image bounds
            x1 = max(0, min(detection["x1"], image_width))
            y1 = max(0, min(detection["y1"], image_height))
            x2 = max(x1, min(detection["x2"], image_width))
            y2 = max(y1, min(detection["y2"], image_height))
            
            bb_id = str(uuid.uuid4())
            detection_record = Detection(
                id=bb_id,
                page_id=page_id,
                project_id=project_id,
                class_name=detection["label"],
                confidence=detection["confidence"],
                bbox_x1=x1,
                bbox_y1=y1,
                bbox_x2=x2,
                bbox_y2=y2,
                is_manual=False
            )
            self.db.add(detection_record)
            bounding_boxes.append({
                "id": bb_id,
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2,
                "width": x2 - x1,
                "height": y2 - y1,
                "label": detection["label"],
                "confidence": detection["confidence"]
            })
        
        return bounding_boxes

    def get_project_pages(self, project_id: str):
        """Get all pages for a project with their bounding boxes"""
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        pages = self.db.query(Page).filter(Page.project_id == project_id).order_by(Page.page_number).all()
        
        page_data = []
        for page in pages:
            # Get bounding boxes for this page
            detections = self.db.query(Detection).filter(Detection.page_id == page.id).all()
            bounding_boxes = [
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
            
            page_data.append({
                "page_id": page.id,
                "page_number": page.page_number,
                "image_url": page.image_url,
                "width": page.width,
                "height": page.height,
                "bounding_boxes": bounding_boxes
            })
        
        return {
            "project_id": project_id,
            "pages": page_data,
            "pageCount": len(page_data)
        }
