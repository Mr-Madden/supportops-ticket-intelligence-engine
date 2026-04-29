from fastapi import FastAPI
from app.core.config import settings
from app.routers import webhook, analyze, admin, metrics

app = FastAPI(title="SupportOps Ticket Intelligence Engine")

# include routers
app.include_router(webhook.router)
app.include_router(analyze.router)
app.include_router(admin.router)
app.include_router(metrics.router)

@app.get("/")
def root():
    return {"message": "SupportOps Ticket Intelligence Engine is running"}
