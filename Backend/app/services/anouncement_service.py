from app.services.base import BaseService
from app.models.announcement import Announcement
from sqlalchemy import desc

class AnnouncementService(BaseService):

    def get_announcements(self):
        return (
            self.db.query(Announcement)
            .order_by(desc(Announcement.is_pinned), desc(Announcement.created_at))
            .all()
        )

    def create_announcement(self, data):
        announcement = Announcement(**data.model_dump())
        self.db.add(announcement)
        self.db.commit()
        self.db.refresh(announcement)
        return announcement

    def delete_announcement(self, announcement_id: str):
        self.db.query(Announcement).filter(
            Announcement.id == announcement_id
        ).delete()
        self.db.commit()
