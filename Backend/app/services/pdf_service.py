import os
import io
import uuid
import logging
from pathlib import Path
import torch
from fastapi import UploadFile, HTTPException
from pdf2image import convert_from_bytes
from PIL import Image

logger = logging.getLogger(__name__)

# Import tiled detection service
from app.services.tiled_detection_service import TiledDetectionService

_original_load = torch.load
def safe_load(*args, **kwargs):
    if "weights_only" not in kwargs:
        kwargs["weights_only"] = False
    return _original_load(*args, **kwargs)
torch.load = safe_load

default_model_path = Path(__file__).resolve().parents[2] / "best.pt"
MODEL_PATH = os.getenv("MODEL_PATH", str(default_model_path))
MODEL_TASK = os.getenv("MODEL_TASK")
MODEL_LOAD_ERROR = None

try:
    from ultralytics import YOLO
    from ultralytics.nn.modules.head import Detect, OBB, Pose, Segment

    def _patch_yolo_heads(model):
        """Patch older OBB/Segment/Pose heads missing the `detect` attribute."""
        torch_model = getattr(model, "model", None)
        if torch_model is None:
            return False
        patched = False
        for module in torch_model.modules():
            if isinstance(module, (OBB, Segment, Pose)) and not hasattr(module, "detect"):
                module.detect = Detect.forward
                patched = True
        return patched

    if os.path.exists(MODEL_PATH):
        ai_model = YOLO(MODEL_PATH, task=MODEL_TASK) if MODEL_TASK else YOLO(MODEL_PATH)
        if _patch_yolo_heads(ai_model):
            logger.info("Patched YOLO head modules missing 'detect' attribute.")
        logger.info(
            "YOLO model loaded from %s (task=%s)",
            MODEL_PATH,
            MODEL_TASK or "auto",
        )
    else:
        ai_model = None
        MODEL_LOAD_ERROR = f"Model file not found at {MODEL_PATH}"
        logger.error(MODEL_LOAD_ERROR)
except Exception as e:
    ai_model = None
    MODEL_LOAD_ERROR = f"{type(e).__name__}: {e}"
    logger.exception("Failed to load YOLO model from %s", MODEL_PATH)

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

    async def upload_pre_converted_pages(self, project_id: str, page_files: list):
        """
        Upload pre-converted page images (from client-side PDF processing)
        This is faster because client already converted PDF to images
        """
        project = (
            self.db.query(Project)
            .filter(Project.id == project_id)
            .first()
        )
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Clear existing pages
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

        page_data = []

        for i, page_file in enumerate(page_files, start=1):
            try:
                # Read the image file
                image_bytes = await page_file.read()
                image = Image.open(io.BytesIO(image_bytes))
                
                # Upload to Cloudinary
                filename = f"{project_id}_{uuid.uuid4()}_page_{i}"
                upload_result = CloudinaryService.upload_image(
                    image_bytes,
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
                
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to process page {i}: {str(e)}"
                )

        project.page_count = len(page_files)
        if page_data:
            project.pdf_url = page_data[0]["image_url"]

        self.db.commit()

        return {
            "message": "Pages uploaded successfully",
            "pages": page_data,
            "pageCount": len(page_files),
        }

    def generate_detections(self, page_id: str, project_id: str, image: Image.Image):
        if not ai_model:
            message = "AI model not loaded. Cannot run detections."
            logger.error(message)
            raise HTTPException(status_code=503, detail=message)

        try:
            results = ai_model(image)
            if isinstance(results, list) and len(results) > 1:
                results = results[:1]
            bounding_boxes = []

            for result in results:
                if result.boxes is not None:
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
                            is_edited=False,
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
                            "is_edited": False,
                        })
                elif result.obb is not None:
                    obb = result.obb.cpu()
                    xyxys = obb.xyxy
                    confs = obb.conf
                    clss = obb.cls
                    for i in range(len(obb)):
                        x1, y1, x2, y2 = xyxys[i]
                        conf = float(confs[i])
                        cls = int(clss[i])
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
                            is_edited=False,
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
                            "is_edited": False,
                        })

            return bounding_boxes

        except Exception as e:
            logger.exception(
                "YOLO inference failed for page_id=%s project_id=%s",
                page_id,
                project_id,
            )
            raise HTTPException(status_code=500, detail=f"AI detection failed: {type(e).__name__}")

    def generate_detections_tiled(self, page_id: str, project_id: str, image: Image.Image):
        """
        Generate detections using tiled inference for better accuracy on large images.
        
        Args:
            page_id: Page ID
            project_id: Project ID
            image: PIL Image object
            
        Returns:
            List of bounding boxes
        """
        try:
            # Initialize tiled detection service
            tiled_service = TiledDetectionService(MODEL_PATH)
            
            # Run tiled detection
            detections = tiled_service.detect_with_tiling(image, confidence=0.25)
            
            bounding_boxes = []
            
            # Save detections to database
            for det in detections:
                bb_id = str(uuid.uuid4())
                
                record = Detection(
                    id=bb_id,
                    page_id=page_id,
                    project_id=project_id,
                    class_name=det['class_name'],
                    confidence=det['confidence'],
                    bbox_x1=det['bbox_x1'],
                    bbox_y1=det['bbox_y1'],
                    bbox_x2=det['bbox_x2'],
                    bbox_y2=det['bbox_y2'],
                    is_manual=False,
                    is_edited=False,
                )
                self.db.add(record)
                
                bounding_boxes.append({
                    "id": bb_id,
                    "x1": det['bbox_x1'],
                    "y1": det['bbox_y1'],
                    "x2": det['bbox_x2'],
                    "y2": det['bbox_y2'],
                    "label": det['class_name'],
                    "confidence": det['confidence'],
                    "is_manual": False,
                    "is_edited": False,
                })
            
            logger.info(f"✅ Tiled detection completed: {len(bounding_boxes)} detections")
            return bounding_boxes
            
        except Exception as e:
            logger.exception(
                "Tiled YOLO inference failed for page_id=%s project_id=%s",
                page_id,
                project_id,
            )
            raise HTTPException(status_code=500, detail=f"Tiled AI detection failed: {type(e).__name__}")

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
                    "is_edited": d.is_edited,
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

def get_model_status():
    return {
        "model_loaded": ai_model is not None,
        "model_path": MODEL_PATH,
        "model_exists": os.path.exists(MODEL_PATH),
        "model_task": MODEL_TASK or "auto",
        "error": MODEL_LOAD_ERROR,
    }
