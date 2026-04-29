from fastapi import APIRouter

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.get("/")
def metrics_root():
    return {"uptime": "running"}
