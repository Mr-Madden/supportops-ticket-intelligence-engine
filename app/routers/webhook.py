from fastapi import APIRouter

router = APIRouter(prefix="/webhook", tags=["Webhook"])

@router.get("/")
def webhook_root():
    return {"message": "Webhook endpoint active"}
