from datetime import date
from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    birth_date: date | None = None
    phone: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdateRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    birth_date: date | None = None
    phone: str | None = None


class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    birth_date: date | None
    phone: str | None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
