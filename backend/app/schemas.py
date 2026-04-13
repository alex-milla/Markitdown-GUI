from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ConversionOut(BaseModel):
    id: int
    original_filename: str
    stored_filename: str
    file_size: int | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
