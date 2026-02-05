from app.services.base import BaseService
from app.models.projects import Project
from app.models.pages import Page
from app.models.users import User
from app.models.members import Team
from sqlalchemy import desc
from datetime import datetime
from fastapi import HTTPException

class ProjectService(BaseService):

    def list_projects(self, user_id: str | None = None):
        q = self.db.query(Project)
        if user_id:
            q = q.filter(Project.user_id == user_id)
        return q.order_by(desc(Project.updated_at)).all()

    def get_project(self, project_id: str):
        return self.db.query(Project).filter(Project.id == project_id).first()

    def create_project(self, data):
        project_data = data.model_dump()
        
        # Validate user exists
        if not self.db.query(User).filter(User.id == project_data.get('user_id')).first():
            raise HTTPException(status_code=400, detail="User not found")
        
        # Validate team exists (if team_id is provided and not empty)
        team_id = project_data.get('team_id')
        if team_id and team_id.strip() and team_id != 'null':
            if not self.db.query(Team).filter(Team.id == team_id).first():
                raise HTTPException(status_code=400, detail="Team not found")
        else:
            # Set team_id to None if not provided, empty, or 'null'
            project_data['team_id'] = None
        
        # Ensure pdf_url and thumbnail_url have default values if not provided
        if 'pdf_url' not in project_data or project_data['pdf_url'] is None:
            project_data['pdf_url'] = ""
        if 'thumbnail_url' not in project_data or project_data['thumbnail_url'] is None:
            project_data['thumbnail_url'] = ""
        
        project = Project(**project_data)
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def update_project(self, project_id: str, updates: dict):
        project = self.get_project(project_id)
        if not project:
            return None

        for key, value in updates.items():
            setattr(project, key, value)

        project.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(project)
        return project

    def delete_project(self, project_id: str):
        project = self.get_project(project_id)
        if project:
            self.db.delete(project)
            self.db.commit()

    def upload_project_pdf(self, project_id: str, pdf_url: str):
        return self.update_project(project_id, {"pdf_url": pdf_url})

    def get_pages(self, project_id: str):
        """Get list of pages for a project from the database"""
        project = self.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        pages = (
            self.db.query(Page)
            .filter(Page.project_id == project_id)
            .order_by(Page.page_number)
            .all()
        )

        return [
            {
                "page_id": p.id,
                "page_number": p.page_number,
                "image_url": p.image_url,
                "width": p.width,
                "height": p.height,
            }
            for p in pages
        ]
