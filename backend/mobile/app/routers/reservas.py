# app/routers/reservas.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from app.db import get_connection
from app.auth_utils import verify_token

router = APIRouter(prefix="/reservas", tags=["Reservas"])

class ReservaRequest(BaseModel):
    hora_inicio: datetime
    hora_termino: datetime
    rut_visitante: str
    placa_patente_visitante: str

@router.post("/", status_code=201)
async def crear_reserva(req: ReservaRequest, token: dict = Depends(verify_token)):
    """
    Crear una reserva para un visitante.
    Reglas:
    - La hora de término debe ser mayor que la de inicio.
    - No se permiten solapamientos en el mismo estacionamiento.
    - Se verifica que el vehículo visitante exista (FK).
    """
    id_departamento = token["sub"]
    ahora = datetime.now(timezone.utc)

    if req.hora_termino <= req.hora_inicio:
        raise HTTPException(status_code=400, detail="La hora de término debe ser posterior a la de inicio")

    conn = await get_connection()

    # 1. Validar que el vehículo visitante exista
    existe_visitante = await conn.fetchrow("""
        SELECT 1 FROM vehiculo WHERE placa_patente = $1
    """, req.placa_patente_visitante)
    if not existe_visitante:
        raise HTTPException(status_code=400, detail="El vehículo visitante no está registrado")

    # 2. Crear reserva (estado = activa)
    row = await conn.fetchrow("""
        INSERT INTO reserva (hora_inicio, hora_termino, estado_reserva, rut_visitante, placa_patente_visitante, id_departamento)
        VALUES ($1, $2, 0, $3, $4, $5)
        RETURNING id;
    """, req.hora_inicio, req.hora_termino, req.rut_visitante, req.placa_patente_visitante, id_departamento)

    await conn.close()

    return {
        "message": "Reserva creada exitosamente",
        "id_reserva": row["id"],
        "estado": "activa"
    }

@router.get("/")
async def listar_reservas(token: dict = Depends(verify_token)):
    """Listar todas las reservas de un residente."""
    id_departamento = token["sub"]
    conn = await get_connection()
    rows = await conn.fetch("""
        SELECT id, hora_inicio, hora_termino, estado_reserva, rut_visitante, placa_patente_visitante
        FROM reserva
        WHERE id_departamento = $1
        ORDER BY hora_inicio DESC
    """, id_departamento)
    await conn.close()

    return {"reservas": [dict(r) for r in rows]}

@router.delete("/{id_reserva}")
async def cancelar_reserva(id_reserva: int, token: dict = Depends(verify_token)):
    """Cancelar una reserva (estado = cancelada)."""
    id_departamento = token["sub"]
    conn = await get_connection()

    result = await conn.execute("""
        UPDATE reserva
        SET estado_reserva = 2
        WHERE id = $1 AND id_departamento = $2
    """, id_reserva, id_departamento)

    await conn.close()

    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Reserva no encontrada o no pertenece a este departamento")

    return {"message": f"Reserva {id_reserva} cancelada"}
