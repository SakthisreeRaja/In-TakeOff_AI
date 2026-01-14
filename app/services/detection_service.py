from app.services.base import BaseService
from app.models.detections import Detection
from sqlalchemy import asc

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
