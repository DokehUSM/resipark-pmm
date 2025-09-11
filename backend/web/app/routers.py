from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import Conserje

router = APIRouter(prefix="/conserjes", tags=["Conserjes"])

# Dependencia para obtener sesión de BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def listar_conserjes(db: Session = Depends(get_db)):
    return db.query(Conserje).all()
