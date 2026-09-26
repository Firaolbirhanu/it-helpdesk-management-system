from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.database import engine
from app.database.base import Base
from app.routers import auth
from app.routers import users
from app.routers import tickets
from app.routers import assignments
from app.routers import comments
from app.routers import status_history
from app.routers import categories
from app.routers import notifications
from app.routers import audit_logs
from app.routers import departments

from app.models import (
    Role,
    Department,
    User,
    TicketCategory,
    Ticket,
)


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for the IT Help Desk and Service Management System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tickets.router)
app.include_router(assignments.router)
app.include_router(comments.router)
app.include_router(status_history.router)
app.include_router(categories.router)
app.include_router(notifications.router)
app.include_router(audit_logs.router)
app.include_router(departments.router)

@app.get("/")
def root():
    return {
        "message": "IT Help Desk API is running",
        "status": "success",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
    }