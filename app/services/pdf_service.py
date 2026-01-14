import os
from fastapi import UploadFile, HTTPException
from pdf2image import convert_from_bytes

from app.services.base import BaseService
from app.models.projects import Project

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

        # 🔥 Convert PDF → PNG (LOCAL, NO CLOUD)
        images = convert_from_bytes(
            pdf_bytes,
            dpi=200,       # IMPORTANT for HVAC drawings
            fmt="png",
        )

        project_dir = os.path.join(UPLOAD_ROOT, project_id)
        os.makedirs(project_dir, exist_ok=True)

        page_urls = []

        for i, image in enumerate(images, start=1):
            file_path = os.path.join(project_dir, f"page_{i}.png")
            image.save(file_path, "PNG")
            page_urls.append(f"/uploads/{project_id}/page_{i}.png")

        # Update DB (same as old storage.updateProject)
        project.pdf_url = page_urls[0]
        project.page_count = len(page_urls)
        self.db.commit()

        return {
            "message": "PDF uploaded and converted successfully",
            "pages": page_urls,
            "pageCount": len(page_urls),
        }
