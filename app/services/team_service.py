from app.services.base import BaseService
from app.models.members import Team
from fastapi import HTTPException

class TeamService(BaseService):

    def get_team(self, team_id: str):
        return self.db.query(Team).filter(Team.id == team_id).first()

    def list_teams(self):
        return self.db.query(Team).all()

    def create_team(self, data):
        team_data = data.model_dump()
        team = Team(**team_data)
        self.db.add(team)
        self.db.commit()
        self.db.refresh(team)
        return team

    def delete_team(self, team_id: str):
        team = self.get_team(team_id)
        if team:
            self.db.delete(team)
            self.db.commit()