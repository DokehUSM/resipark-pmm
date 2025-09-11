from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import Usuario

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import SessionLocal
from sqlalchemy import text
from typing import Dict, Any

router = APIRouter()

# Dependencia: obtener sesión de BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/usuarios")
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()
    

@router.get("/validar-patente/{patente}")
def validar_patente(patente: str, db: Session = Depends(get_db)):
    """
    Valida si una patente existe en el sistema y determina si es residente o visitante
    
    - **patente**: Patente del vehículo a validar (ej: ABC123, VIS111)
    """
    # Validar que la patente no esté vacía
    if not patente or not patente.strip():
        raise HTTPException(
            status_code=400, 
            detail="La patente no puede estar vacía"
        )
    
    patente_clean = patente.upper().strip()
    
    try:
        # Consulta única con LEFT JOIN para obtener toda la información
        query = text("""
            SELECT 
                v.placa_patente,
                vr.color,
                vr.categoria_vehiculo,
                vr.numero_departamento,
                vv.rut,
                CASE 
                    WHEN vr.placa_patente IS NOT NULL THEN 'residente'
                    WHEN vv.placa_patente IS NOT NULL THEN 'visitante'
                    ELSE 'desconocido'
                END as tipo_vehiculo
            FROM vehiculo v
            LEFT JOIN vehiculo_residente vr ON v.placa_patente = vr.placa_patente
            LEFT JOIN vehiculo_visitante vv ON v.placa_patente = vv.placa_patente
            WHERE v.placa_patente = :patente
        """)
        
        resultado = db.execute(query, {"patente": patente_clean}).fetchone()
        
        if not resultado:
            return {
                "existe": False,
                "mensaje": f"Patente {patente_clean} no encontrada en el sistema"
            }
        
        # Construir respuesta basada en el tipo de vehículo
        if resultado.tipo_vehiculo == 'residente':
            return {
                "existe": True,
                "tipo_vehiculo": "residente",
                "datos_vehiculo": {
                    "placa_patente": resultado.placa_patente,
                    "color": resultado.color,
                    "categoria_vehiculo": resultado.categoria_vehiculo,
                    "numero_departamento": resultado.numero_departamento
                },
                "mensaje": "Vehículo residente encontrado"
            }
        
        elif resultado.tipo_vehiculo == 'visitante':
            return {
                "existe": True,
                "tipo_vehiculo": "visitante",
                "datos_vehiculo": {
                    "placa_patente": resultado.placa_patente,
                    "rut": resultado.rut
                },
                "mensaje": "Vehículo visitante encontrado"
            }
        
        else:
            return {
                "existe": True,
                "tipo_vehiculo": "desconocido",
                "datos_vehiculo": {"placa_patente": resultado.placa_patente},
                "mensaje": "Vehículo registrado pero sin clasificación específica"
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al consultar la base de datos: {str(e)}"
        )