from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.teams import TeamCreate, TeamRead
from app.services.team_service import TeamService

router = APIRouter(prefix="/teams", tags=["Teams"])

@router.post("/", response_model=TeamRead, status_code=201)
def create_team(
    payload: TeamCreate,
    db: Session = Depends(get_db),
):
    return TeamService(db).create_team(payload)

@router.get("/{team_id}", response_model=TeamRead)
def get_team(team_id: str, db: Session = Depends(get_db)):
    team = TeamService(db).get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.get("/", response_model=list[TeamRead])
def list_teams(db: Session = Depends(get_db)):
    return TeamService(db).list_teams()