from app.services.base import BaseService
from app.models.projects import Project
from app.models.users import User
from app.models.members import Team
from sqlalchemy import desc
from datetime import datetime
from fastapi import HTTPException
import os
import glob

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
        """Get list of page files for a project"""
        # Check if project exists
        project = self.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Define the uploads directory path for this project
        upload_path = os.path.join("uploads", project_id)
        
        # Check if the directory exists
        if not os.path.exists(upload_path):
            return []
        
        # Find all page files (PNG images) in the project directory
        page_pattern = os.path.join(upload_path, "page_*.png")
        page_files = glob.glob(page_pattern)
        
        # Extract page numbers and create a list of page information
        pages = []
        for file_path in page_files:
            filename = os.path.basename(file_path)
            # Extract page number from filename (e.g., "page_1.png" -> 1)
            if filename.startswith("page_") and filename.endswith(".png"):
                try:
                    page_num = int(filename[5:-4])  # Remove "page_" and ".png"
                    pages.append({
                        "page_number": page_num,
                        "filename": filename,
                        "url": f"/{file_path.replace(os.sep, '/')}"  # Convert to web URL format
                    })
                except ValueError:
                    # Skip files that don't have valid page numbers
                    continue
        
        # Sort pages by page number
        pages.sort(key=lambda x: x["page_number"])
        
        return pages
