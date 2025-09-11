from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .db import SessionLocal
from .models import EstacionamientoEstado

router = APIRouter()

# Dependency para obtener la sesión de DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/health")
async def health():
    return {"ok": True}

@router.get("/estados")
def list_estados(db: Session = Depends(get_db)):
    rows = db.query(EstacionamientoEstado).all()
    return [
        {
            "estacionamiento_numero": r.estacionamiento_numero,
            "estado": r.estado,
            "estado_label": {0: "libre", 1: "ocupado", 2: "pendiente"}.get(r.estado, "desconocido"),
            "updated_at": r.updated_at,
        }
        for r in rows
    ]

@router.get("/estados/{numero}")
def get_estado(numero: int, db: Session = Depends(get_db)):
    row = db.query(EstacionamientoEstado).filter(
        EstacionamientoEstado.estacionamiento_numero == numero
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Estacionamiento no encontrado")
    return {
        "estacionamiento_numero": row.estacionamiento_numero,
        "estado": row.estado,
        "estado_label": {0: "libre", 1: "ocupado", 3: "pendiente"}.get(row.estado, "desconocido"),
        "updated_at": row.updated_at,
    }
