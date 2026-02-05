from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth_router

from db import engine, Base
import uesrModels
from auth import router as auth_router

# creates SQL tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# used for checking if the server is running
@app.get("/health")
def health():
    return {"ok": True}

app.include_router(auth_router, prefix="/auth")