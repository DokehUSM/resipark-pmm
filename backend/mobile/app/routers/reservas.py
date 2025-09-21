# app/routers/reservas.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime

from app.auth_utils import verify_token
from app.db import get_connection

router = APIRouter(prefix="/reservas", tags=["Reservas"])

# ------------------------
# Modelos de request
# ------------------------
class ReservaRequest(BaseModel):
    hora_inicio: datetime
    hora_termino: datetime
    rut_visitante: str
    placa_patente_visitante: str


class EditReservaRequest(BaseModel):
    hora_inicio: datetime
    hora_termino: datetime
    rut_visitante: str
    placa_patente_visitante: str


@router.post("/", status_code=201)
async def crear_reserva(req: ReservaRequest, token: dict = Depends(verify_token)):
    """Crear una reserva para un visitante."""
    id_departamento = token["sub"]
    hora_inicio = req.hora_inicio
    hora_termino = req.hora_termino

    if hora_termino <= hora_inicio:
        raise HTTPException(status_code=400, detail="La hora de termino debe ser posterior a la de inicio")

    conn = await get_connection()

    estacionamientos_totales = await conn.fetchval("SELECT COUNT(*) FROM estacionamiento")

    reservas_activas = await conn.fetchval(
        """
        SELECT COUNT(*)
          FROM reserva
         WHERE estado_reserva = 0
           AND hora_termino > NOW()
        """
    )

    ocupados = await conn.fetchval("SELECT COUNT(*) FROM estacionamiento WHERE ocupado = TRUE")

    if reservas_activas >= estacionamientos_totales:
        await conn.close()
        raise HTTPException(
            status_code=400,
            detail="No se pueden crear mas reservas: todos los estacionamientos ya estan reservados",
        )

    if ocupados >= estacionamientos_totales:
        await conn.close()
        raise HTTPException(
            status_code=400,
            detail="No se pueden crear reservas: todos los estacionamientos estan ocupados",
        )

    row = await conn.fetchrow(
        """
        INSERT INTO reserva (
            hora_inicio,
            hora_termino,
            estado_reserva,
            rut_visitante,
            placa_patente_visitante,
            id_departamento
        )
        VALUES ($1, $2, 0, $3, $4, $5)
        RETURNING id;
        """,
        hora_inicio,
        hora_termino,
        req.rut_visitante,
        req.placa_patente_visitante,
        id_departamento,
    )

    await conn.close()

    return {
        "message": "Reserva creada exitosamente",
        "id_reserva": row["id"],
        "estado": "activa",
    }


@router.get("/")
async def listar_reservas(token: dict = Depends(verify_token)):
    """Listar todas las reservas de un residente autenticado."""
    id_departamento = token["sub"]
    conn = await get_connection()

    rows = await conn.fetch(
        """
        SELECT r.id,
               r.hora_inicio,
               r.hora_termino,
               CASE
                   WHEN r.hora_termino < NOW() AND r.estado_reserva = 0 THEN 'Vencida'
                   ELSE e.nombre
               END AS estado_reserva,
               r.rut_visitante,
               r.placa_patente_visitante
          FROM reserva r
          JOIN estado_reserva e ON e.id = r.estado_reserva
         WHERE r.id_departamento = $1
         ORDER BY r.hora_inicio DESC
        """,
        id_departamento,
    )

    await conn.close()

    return {"reservas": [dict(r) for r in rows]}


@router.put("/{id_reserva}")
async def editar_reserva(
    id_reserva: int,
    req: EditReservaRequest,
    token: dict = Depends(verify_token),
):
    """Editar una reserva existente."""
    id_departamento = token["sub"]

    if req.hora_termino <= req.hora_inicio:
        raise HTTPException(
            status_code=400,
            detail="La hora de termino debe ser posterior a la de inicio",
        )

    conn = await get_connection()
    try:
        result = await conn.execute(
            """
            UPDATE reserva
               SET hora_inicio = $1,
                   hora_termino = $2,
                   rut_visitante = $3,
                   placa_patente_visitante = $4
             WHERE id = $5
               AND id_departamento = $6
            """,
            req.hora_inicio,
            req.hora_termino,
            req.rut_visitante,
            req.placa_patente_visitante,
            id_reserva,
            id_departamento,
        )
    finally:
        await conn.close()

    if result == "UPDATE 0":
        raise HTTPException(
            status_code=404,
            detail="Reserva no encontrada o no pertenece a este departamento",
        )

    return {"message": f"Reserva {id_reserva} actualizada"}


@router.delete("/{id_reserva}")
async def cancelar_reserva(id_reserva: int, token: dict = Depends(verify_token)):
    """Cancelar una reserva cambiando su estado a cancelada."""
    id_departamento = token["sub"]
    conn = await get_connection()

    result = await conn.execute(
        """
        UPDATE reserva
           SET estado_reserva = 2
         WHERE id = $1
           AND id_departamento = $2
        """,
        id_reserva,
        id_departamento,
    )

    await conn.close()

    if result == "UPDATE 0":
        raise HTTPException(
            status_code=404,
            detail="Reserva no encontrada o no pertenece a este departamento",
        )

    return {"message": f"Reserva {id_reserva} cancelada"}
