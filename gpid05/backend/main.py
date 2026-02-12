from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import userModels
import auditModels
import resetTokenModels
import sessionModels
from auth import router as auth_router

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

app.include_router(auth_router)