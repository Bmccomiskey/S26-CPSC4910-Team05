from fastapi import APIRouter
from pydantic import BaseModel
from db import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

# uses the pydantic "BaseModel" to define and validate expected request body
class RegisterBody(BaseModel):
    email: str
    password: str
    role: str

class LoginBody(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(body: RegisterBody, db: Session = Depends(get_db)):
    return {"message": "User registered successfully"}

@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    return {"message": "User logged in successfully"}