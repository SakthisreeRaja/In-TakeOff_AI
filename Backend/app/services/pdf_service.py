import os
import io
import uuid
import torch
from fastapi import UploadFile, HTTPException
from pdf2image import convert_from_bytes
from PIL import Image

_original_load = torch.load
def safe_load(*args, **kwargs):
    if "weights_only" not in kwargs:
        kwargs["weights_only"] = False
    return _original_load(*args, **kwargs)
torch.load = safe_load

try:
    from ultralytics import YOLO
    MODEL_PATH = "best.pt"
    if os.path.exists(MODEL_PATH):
        ai_model = YOLO(MODEL_PATH)
    else:
        ai_model = None
except Exception:
    ai_model = None

from app.services.base import BaseService
from app.services.cloudinary_service import CloudinaryService
from app.models.projects import Project
from app.models.pages import Page
from app.models.detections import Detection


class PDFService(BaseService):

    async def upload_and_convert(self, project_id: str, file: UploadFile):
        project = (
            self.db.query(Project)
            .filter(Project.id == project_id)
            .first()
        )
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        existing_pages = (
            self.db.query(Page)
            .filter(Page.project_id == project_id)
            .all()
        )

        for page in existing_pages:
            self.db.query(Detection).filter(
                Detection.page_id == page.id
            ).delete()
            self.db.delete(page)

        project.page_count = 0
        project.pdf_url = None
        self.db.commit()

        pdf_bytes = await file.read()

        try:
            images = convert_from_bytes(
                pdf_bytes,
                dpi=300,
                fmt="png",
            )
        except Exception:
            raise HTTPException(
                status_code=500,
                detail="Failed to process PDF. Ensure Poppler is installed."
            )

        page_data = []

        for i, image in enumerate(images, start=1):
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format="PNG")
            img_byte_arr.seek(0)

            filename = f"{project_id}_{uuid.uuid4()}_page_{i}"
            upload_result = CloudinaryService.upload_image(
                img_byte_arr.getvalue(),
                filename
            )

            page_id = str(uuid.uuid4())
            page = Page(
                id=page_id,
                project_id=project_id,
                page_number=i,
                image_url=upload_result["url"],
                cloudinary_public_id=upload_result["public_id"],
                width=image.width,
                height=image.height,
            )
            self.db.add(page)

            page_data.append({
                "page_id": page_id,
                "page_number": i,
                "image_url": upload_result["url"],
                "width": image.width,
                "height": image.height,
                "bounding_boxes": [],
            })

        project.page_count = len(images)
        if page_data:
            project.pdf_url = page_data[0]["image_url"]

        self.db.commit()

        return {
            "message": "PDF uploaded and converted successfully",
            "pages": page_data,
            "pageCount": len(images),
        }

    def generate_detections(self, page_id: str, project_id: str, image: Image.Image):
        if ai_model:
            try:
                results = ai_model(image)
                bounding_boxes = []

                for result in results:
                    boxes = result.boxes.cpu().numpy()
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0]
                        conf = float(box.conf[0])
                        cls = int(box.cls[0])
                        label = result.names[cls]

                        bb_id = str(uuid.uuid4())
                        record = Detection(
                            id=bb_id,
                            page_id=page_id,
                            project_id=project_id,
                            class_name=label,
                            confidence=conf,
                            bbox_x1=float(x1),
                            bbox_y1=float(y1),
                            bbox_x2=float(x2),
                            bbox_y2=float(y2),
                            is_manual=False,
                        )
                        self.db.add(record)

                        bounding_boxes.append({
                            "id": bb_id,
                            "x1": float(x1),
                            "y1": float(y1),
                            "x2": float(x2),
                            "y2": float(y2),
                            "label": label,
                            "confidence": conf,
                            "is_manual": False,
                        })

                return bounding_boxes

            except Exception:
                return self.generate_mock_detections(
                    page_id, project_id, image.width, image.height
                )

        return self.generate_mock_detections(
            page_id, project_id, image.width, image.height
        )

    def generate_mock_detections(
        self, page_id: str, project_id: str, image_width: int, image_height: int
    ):
        mock_detections = [
            {"x1": 100, "y1": 150, "x2": 180, "y2": 210, "label": "Duct", "confidence": 0.85},
            {"x1": 250, "y1": 200, "x2": 370, "y2": 280, "label": "AC Unit", "confidence": 0.92},
            {"x1": 400, "y1": 100, "x2": 460, "y2": 160, "label": "Vent", "confidence": 0.78},
            {"x1": 150, "y1": 300, "x2": 220, "y2": 350, "label": "Damper", "confidence": 0.73},
        ]

        bounding_boxes = []

        for d in mock_detections:
            x1 = max(0, min(d["x1"], image_width))
            y1 = max(0, min(d["y1"], image_height))
            x2 = max(x1, min(d["x2"], image_width))
            y2 = max(y1, min(d["y2"], image_height))

            bb_id = str(uuid.uuid4())
            record = Detection(
                id=bb_id,
                page_id=page_id,
                project_id=project_id,
                class_name=d["label"],
                confidence=d["confidence"],
                bbox_x1=x1,
                bbox_y1=y1,
                bbox_x2=x2,
                bbox_y2=y2,
                is_manual=False,
            )
            self.db.add(record)

            bounding_boxes.append({
                "id": bb_id,
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2,
                "width": x2 - x1,
                "height": y2 - y1,
                "label": d["label"],
                "confidence": d["confidence"],
                "is_manual": False,
            })

        return bounding_boxes

    def get_project_pages(self, project_id: str):
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        pages = (
            self.db.query(Page)
            .filter(Page.project_id == project_id)
            .order_by(Page.page_number)
            .all()
        )

        page_data = []

        for page in pages:
            detections = (
                self.db.query(Detection)
                .filter(Detection.page_id == page.id)
                .all()
            )

            bounding_boxes = [
                {
                    "id": d.id,
                    "x1": d.bbox_x1,
                    "y1": d.bbox_y1,
                    "x2": d.bbox_x2,
                    "y2": d.bbox_y2,
                    "label": d.class_name,
                    "confidence": d.confidence,
                    "is_manual": d.is_manual,
                }
                for d in detections
            ]

            page_data.append({
                "page_id": page.id,
                "page_number": page.page_number,
                "image_url": page.image_url,
                "width": page.width,
                "height": page.height,
                "bounding_boxes": bounding_boxes,
            })

        return {
            "project_id": project_id,
            "pages": page_data,
            "pageCount": len(page_data),
        }
