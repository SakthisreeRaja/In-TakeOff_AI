import time
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.core.database import engine
from app.models import users, projects, detections, members, boqexports, pages

from app.api import (
    projects as projects_api,
    uploads,
    pages as pages_api,
    detections as detections_api,
    users as users_api,
    teams as teams_api,
)

load_dotenv()

print("✓ Database configured (Alembic managed)")

app = FastAPI(
    title="HVAC AI Backend",
    version="1.0.0",
)

# ----------------------------
# 🔥 CORS (THIS FIXES EVERYTHING)
# ----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# ROUTERS
# ----------------------------
app.include_router(users_api.router, prefix="/api")
app.include_router(teams_api.router, prefix="/api")
app.include_router(projects_api.router, prefix="/api")
app.include_router(uploads.router, prefix="/api")
app.include_router(pages_api.router, prefix="/api")
app.include_router(detections_api.router, prefix="/api")

# ----------------------------
# LOGGING
# ----------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = int((time.time() - start_time) * 1000)

    if request.url.path.startswith("/api"):
        print(
            f"{request.method} {request.url.path} "
            f"{response.status_code} in {duration}ms"
        )

    return response

# ----------------------------
# ERROR HANDLERS
# ----------------------------
@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    print(f"INTERNAL ERROR: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"UNHANDLED ERROR: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Unhandled error"}
    )
