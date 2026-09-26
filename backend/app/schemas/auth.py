from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    employee_id: str = Field(..., min_length=1, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    department_id: int
    phone: str | None = Field(default=None, max_length=30)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 900


class TokenRefresh(BaseModel):
    refresh_token: str


class TokenData(BaseModel):
    user_id: int
    role: str
    token_type: str