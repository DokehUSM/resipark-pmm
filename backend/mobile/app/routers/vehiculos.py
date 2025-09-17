from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.db import get_connection
from app.auth_utils import verify_token

router = APIRouter(prefix="/vehiculos", tags=["Vehículos"])

# ------------------------
# Modelos de request
# ------------------------
class VehiculoRequest(BaseModel):
    placa_patente: str
    tipo_vehiculo: int   # ej: 1 = residente, 2 = visitante

class UpdateVehiculoRequest(BaseModel):
    tipo_vehiculo: int

# ------------------------
# Crear vehículo
# ------------------------
@router.post("/", status_code=201)
async def add_vehiculo(req: VehiculoRequest, token: dict = Depends(verify_token)):
    id_departamento = token["sub"]

    conn = await get_connection()
    try:
        await conn.execute("""
            INSERT INTO vehiculo (placa_patente, tipo_vehiculo, id_departamento)
            VALUES ($1, $2, $3)
            ON CONFLICT (placa_patente) DO UPDATE
            SET tipo_vehiculo = EXCLUDED.tipo_vehiculo,
                id_departamento = EXCLUDED.id_departamento
        """, req.placa_patente, req.tipo_vehiculo, id_departamento)
    finally:
        await conn.close()

    return {"mensaje": "Vehículo agregado/actualizado", "placa": req.placa_patente}

# ------------------------
# Listar vehículos del residente
# ------------------------
@router.get("/")
async def list_vehiculos(token: dict = Depends(verify_token)):
    id_departamento = token["sub"]

    conn = await get_connection()
    try:
        rows = await conn.fetch("""
            SELECT placa_patente, tipo_vehiculo
            FROM vehiculo
            WHERE id_departamento = $1
            ORDER BY placa_patente
        """, id_departamento)
    finally:
        await conn.close()

    return {"vehiculos": [dict(row) for row in rows]}

# ------------------------
# Editar vehículo
# ------------------------
@router.put("/{placa}")
async def update_vehiculo(placa: str, req: UpdateVehiculoRequest, token: dict = Depends(verify_token)):
    id_departamento = token["sub"]

    conn = await get_connection()
    try:
        result = await conn.execute("""
            UPDATE vehiculo
            SET tipo_vehiculo = $1
            WHERE placa_patente = $2 AND id_departamento = $3
        """, req.tipo_vehiculo, placa, id_departamento)
    finally:
        await conn.close()

    if result.endswith("0"):  # No rows affected
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    return {"mensaje": "Vehículo actualizado", "placa": placa}

# ------------------------
# Eliminar vehículo
# ------------------------
@router.delete("/{placa}")
async def delete_vehiculo(placa: str, token: dict = Depends(verify_token)):
    id_departamento = token["sub"]

    conn = await get_connection()
    try:
        result = await conn.execute("""
            DELETE FROM vehiculo
            WHERE placa_patente = $1 AND id_departamento = $2
        """, placa, id_departamento)
    finally:
        await conn.close()

    if result.endswith("0"):  # No rows affected
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    return {"mensaje": "Vehículo eliminado", "placa": placa}
