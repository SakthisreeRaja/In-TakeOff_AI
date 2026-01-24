from app.services.base import BaseService
from app.models.projects import Project
from datetime import datetime, timedelta

class StatsService(BaseService):

    def get_stats(self, user_id: str):
        projects = self.db.query(Project).filter(
            Project.user_id == user_id
        ).all()

        total_projects = len(projects)
        total_detections = sum(p.total_detections or 0 for p in projects)

        one_week_ago = datetime.utcnow() - timedelta(days=7)
        recent_activity = sum(
            1 for p in projects if p.updated_at and p.updated_at > one_week_ago
        )

        return {
            "totalProjects": total_projects,
            "totalDetections": total_detections,
            "teamSize": 1,
            "recentActivity": recent_activity,
        }
