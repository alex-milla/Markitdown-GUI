import os
import uuid
from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Conversion
from app.schemas import ConversionOut
from app.config import CONVERTED_DIR
from app.services.markitdown import run_markitdown

router = APIRouter()


def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


@router.post("/upload", response_model=ConversionOut)
async def upload_file(
    file: Annotated[UploadFile, File()],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    user_dir = os.path.join(CONVERTED_DIR, str(current_user.id))
    ensure_dir(user_dir)

    ext = os.path.splitext(file.filename)[1]
    stored_name = f"{uuid.uuid4().hex}{ext}"
    input_path = os.path.join(user_dir, stored_name)

    content = await file.read()
    with open(input_path, "wb") as f:
        f.write(content)

    output_name = f"{uuid.uuid4().hex}.md"
    output_path = os.path.join(user_dir, output_name)

    try:
        run_markitdown(input_path, output_path)
    except Exception as exc:
        # cleanup output on failure; input is cleaned in finally below
        if os.path.exists(output_path):
            os.remove(output_path)
        raise HTTPException(status_code=500, detail=f"Conversion failed: {exc}")
    finally:
        # remove original uploaded file after conversion
        if os.path.exists(input_path):
            os.remove(input_path)

    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        raise HTTPException(status_code=500, detail="Conversion failed: output file is empty")

    conversion = Conversion(
        owner_id=current_user.id,
        original_filename=file.filename,
        stored_filename=output_name,
        file_size=os.path.getsize(output_path),
        created_at=datetime.utcnow(),
    )
    db.add(conversion)
    db.commit()
    db.refresh(conversion)
    return conversion


@router.get("/history", response_model=list[ConversionOut])
def list_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Conversion).filter(Conversion.owner_id == current_user.id).order_by(Conversion.created_at.desc()).all()


@router.delete("/history/{conversion_id}")
def delete_conversion(
    conversion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.query(Conversion).filter(Conversion.id == conversion_id, Conversion.owner_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="File not found")

    file_path = os.path.join(CONVERTED_DIR, str(current_user.id), conv.stored_filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(conv)
    db.commit()
    return {"detail": "Conversion deleted successfully"}


@router.get("/download/{conversion_id}")
def download_file(
    conversion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.query(Conversion).filter(Conversion.id == conversion_id, Conversion.owner_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="File not found")

    file_path = os.path.join(CONVERTED_DIR, str(current_user.id), conv.stored_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File missing on disk")

    return FileResponse(
        path=file_path,
        filename=conv.original_filename.rsplit(".", 1)[0] + ".md",
        media_type="text/markdown",
    )
