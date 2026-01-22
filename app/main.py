import os
import time
import os
import time
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from app.core.database import engine, Base

# Import all models to register them with SQLAlchemy
from app.models import users, projects, detections, members, boqexports, pages

from app.api import (
    projects,
    uploads,
    pages,
    detections,
    users,
    teams,
)

# --------------------------------------------------
# ENV SETUP
# --------------------------------------------------
load_dotenv()
Base.metadata.create_all(bind=engine)
# --------------------------------------------------
# APP INIT
# --------------------------------------------------
app = FastAPI(
    title="HVAC AI Backend",
    version="1.0.0",
)

# --------------------------------------------------
# ROUTES
# --------------------------------------------------
app.include_router(users.router, prefix="/api")
app.include_router(teams.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(uploads.router, prefix="/api")
app.include_router(pages.router, prefix="/api")
app.include_router(detections.router, prefix="/api")

# --------------------------------------------------
# LOGGING MIDDLEWARE (Express equivalent)
# --------------------------------------------------
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

# --------------------------------------------------
# GLOBAL ERROR HANDLER
# --------------------------------------------------
@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    print(f"INTERNAL ERROR: {exc}")
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"UNHANDLED ERROR: {exc}")
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Unhandled error: {str(exc)}"}
    )
