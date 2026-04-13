from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, convert

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MarkItDown GUI", version="1.0.0")

# CORS is not strictly needed when served from same origin via nginx,
# but kept for local development flexibility.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(convert.router, prefix="/api/convert", tags=["convert"])


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
