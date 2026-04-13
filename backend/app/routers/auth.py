import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserOut, LoginResponse, ChangePasswordPayload
from app.dependencies import get_password_hash, verify_password, create_access_token, get_current_user, require_admin

router = APIRouter()

UPGRADE_TRIGGER = "/opt/markitdown-gui/.upgrade-requested"
UPGRADE_LOG = "/var/log/markitdown-upgrade.log"


@router.post("/register", response_model=UserOut)
def register(
    payload: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    user = User(
        username=payload.username,
        hashed_password=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=LoginResponse)
def login(payload: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "must_change_password": user.must_change_password,
        "is_admin": user.is_admin,
    }


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/change-password")
def change_password(
    payload: ChangePasswordPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.must_change_password = False
    db.commit()
    return {"detail": "Password changed successfully"}


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return db.query(User).all()


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully"}


@router.post("/upgrade")
def trigger_upgrade(admin: User = Depends(require_admin)):
    if os.path.exists(UPGRADE_TRIGGER):
        raise HTTPException(status_code=409, detail="Upgrade already pending")
    try:
        with open(UPGRADE_TRIGGER, "w") as f:
            f.write("")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not schedule upgrade: {exc}")
    return {"detail": "Upgrade scheduled. It will start within 1 minute."}


@router.get("/upgrade/status")
def upgrade_status(admin: User = Depends(require_admin)):
    pending = os.path.exists(UPGRADE_TRIGGER)
    log_lines = []
    if os.path.exists(UPGRADE_LOG):
        try:
            with open(UPGRADE_LOG, "r", encoding="utf-8", errors="ignore") as f:
                log_lines = f.readlines()[-50:]
        except Exception:
            pass
    return {"pending": pending, "log": "".join(log_lines)}
