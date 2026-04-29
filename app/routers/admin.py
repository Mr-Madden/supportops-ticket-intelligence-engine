from fastapi import APIRouter

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/health")
def health_check():
    return {"status": "ok"}
