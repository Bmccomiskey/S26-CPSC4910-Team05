from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import engine, Base, get_db_info
import userModels
import auditModels
import resetTokenModels
import sessionModels
import sponsorshipModels
import points  # ensures PointTransaction table is created on startup
import profileModels  # ensures user_profiles table is created on startup
from applications import router as applications_router
from auth import router as auth_router
from points import router as points_router
from admin import router as admin_router
from catalog import router as catalog_router
from profile import router as profile_router
from redemptions import router as redemptions_router


# creates SQL tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# used for checking if the server is running
@app.get("/health")
def health():
    return {"ok": True}


# returns DB connection status and version info
@app.get("/api/health")
def db_health():
    try:
        info = get_db_info()
        return {
            "status": "connected",
            "team": info["team"],
            "version": info["version"],
            "date": info["date"],
        }
    except Exception as e:
        return {"status": "disconnected", "error": str(e)}


app.include_router(auth_router)
app.include_router(applications_router)
app.include_router(points_router)
app.include_router(admin_router)
app.include_router(catalog_router)
app.include_router(profile_router)
app.include_router(redemptions_router)
