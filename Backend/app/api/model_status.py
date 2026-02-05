from fastapi import APIRouter

from app.services.pdf_service import get_model_status

router = APIRouter()


@router.get("/model-status")
def model_status():
    return get_model_status()
