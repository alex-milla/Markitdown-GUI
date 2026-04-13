from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    is_admin: bool
    must_change_password: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    must_change_password: bool
    is_admin: bool


class ChangePasswordPayload(BaseModel):
    current_password: str
    new_password: str


class ConversionOut(BaseModel):
    id: int
    original_filename: str
    stored_filename: str
    file_size: int | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
