from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.models import User
from app.dependencies import get_password_hash
from app.routers import auth, convert

Base.metadata.create_all(bind=engine)

# Seed default admin if no users exist
def seed_admin():
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            admin = User(
                username="admin",
                hashed_password=get_password_hash("admin"),
                is_admin=True,
                must_change_password=True,
            )
            db.add(admin)
            db.commit()
            print("Default admin user created: admin / admin")
    finally:
        db.close()

seed_admin()

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
