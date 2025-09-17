# app/routers/reservas.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from app.db import get_connection
from app.auth_utils import verify_token

router = APIRouter(prefix="/reservas", tags=["Reservas"])

# ------------------------
# Modelos de request
# ------------------------
class ReservaRequest(BaseModel):
    hora_inicio: datetime
    hora_termino: datetime
    rut_visitante: str
    placa_patente_visitante: str

# ------------------------
# Modelo para edición
# ------------------------
class EditReservaRequest(BaseModel):
    hora_inicio: datetime
    hora_termino: datetime
    rut_visitante: str
    placa_patente_visitante: str

# ------------------------
# Crear reserva
# ------------------------
@router.post("/", status_code=201)
async def crear_reserva(req: ReservaRequest, token: dict = Depends(verify_token)):
    """
    Crear una reserva para un visitante.

    Reglas:
    - La hora de término debe ser mayor que la de inicio.
    - Se asocia siempre a un departamento (residente autenticado).
    - Los datos del visitante (rut y placa) se guardan directamente en la tabla `reserva`.
    """
    id_departamento = token["sub"]

    # Así guardas como "naive" en la BD, pero debes documentar que todos los clientes te envían UTC
    hora_inicio = req.hora_inicio.replace(tzinfo=None)
    hora_termino = req.hora_termino.replace(tzinfo=None)

    if hora_termino <= hora_inicio:
        raise HTTPException(
            status_code=400,
            detail="La hora de término debe ser posterior a la de inicio"
        )

    conn = await get_connection()
    row = await conn.fetchrow("""
        INSERT INTO reserva (
            hora_inicio, hora_termino, estado_reserva,
            rut_visitante, placa_patente_visitante, id_departamento
        )
        VALUES ($1, $2, 0, $3, $4, $5)
        RETURNING id;
    """, hora_inicio, hora_termino,
         req.rut_visitante, req.placa_patente_visitante, id_departamento)
    await conn.close()

    return {
        "message": "Reserva creada exitosamente",
        "id_reserva": row["id"],
        "estado": "activa"
    }


# ------------------------
# Listar reservas
# ------------------------
@router.get("/")
async def listar_reservas(token: dict = Depends(verify_token)):
    """
    Listar todas las reservas de un residente autenticado.

    Mejoras:
    - Devuelve el estado como texto (ej: 'Activa', 'Vencida', 'Cancelada').
    - Aplica "lazy update": si la reserva ya terminó y aún está como 'Activa',
      se devuelve como 'Vencida' en la respuesta (sin modificar la BD).
    """
    id_departamento = token["sub"]
    conn = await get_connection()

    rows = await conn.fetch("""
        SELECT r.id,
               r.hora_inicio,
               r.hora_termino,
               -- Lazy update: si terminó y sigue activa => vencida
               CASE
                   WHEN r.hora_termino < NOW() AND r.estado_reserva = 0
                        THEN 'Vencida'
                   ELSE e.nombre
               END AS estado_reserva,
               r.rut_visitante,
               r.placa_patente_visitante
        FROM reserva r
        JOIN estado_reserva e ON e.id = r.estado_reserva
        WHERE r.id_departamento = $1
        ORDER BY r.hora_inicio DESC
    """, id_departamento)

    await conn.close()

    return {"reservas": [dict(r) for r in rows]}


# ------------------------
# Editar reserva
# ------------------------
@router.put("/{id_reserva}")
async def editar_reserva(
    id_reserva: int,
    req: EditReservaRequest,
    token: dict = Depends(verify_token)
):
    """
    Editar una reserva existente.

    Reglas de negocio:
    - Solo el departamento que creó la reserva puede editarla.
    - Se validan las fechas (`hora_termino` debe ser posterior a `hora_inicio`).
    - Se actualizan los datos del visitante y la placa asociada.
    - Si la reserva no existe o no pertenece al residente autenticado,
      se devuelve un error 404.
    """

    # ID del departamento autenticado (extraído del JWT)
    id_departamento = token["sub"]

    # ------------------------
    # Validación de fechas
    # ------------------------
    if req.hora_termino <= req.hora_inicio:
        raise HTTPException(
            status_code=400,
            detail="La hora de término debe ser posterior a la de inicio"
        )

    # Normalizamos timestamps a naive (UTC asumido).
    # Esto evita conflictos si los clientes envían `2025-09-17T08:00:00Z`.
    hora_inicio = req.hora_inicio.replace(tzinfo=None)
    hora_termino = req.hora_termino.replace(tzinfo=None)

    # ------------------------
    # Conexión a la base de datos y actualización
    # ------------------------
    conn = await get_connection()
    try:
        result = await conn.execute("""
            UPDATE reserva
            SET hora_inicio = $1,
                hora_termino = $2,
                rut_visitante = $3,
                placa_patente_visitante = $4
            WHERE id = $5 AND id_departamento = $6
        """, hora_inicio, hora_termino,
             req.rut_visitante, req.placa_patente_visitante,
             id_reserva, id_departamento)
    finally:
        # Siempre cerramos la conexión, incluso si falla
        await conn.close()

    # ------------------------
    # Validación del resultado
    # ------------------------
    if result == "UPDATE 0":
        # No se encontró la reserva o pertenece a otro departamento
        raise HTTPException(
            status_code=404,
            detail="Reserva no encontrada o no pertenece a este departamento"
        )

    return {"message": f"Reserva {id_reserva} actualizada"}

# ------------------------
# Cancelar reserva
# ------------------------
@router.delete("/{id_reserva}")
async def cancelar_reserva(id_reserva: int, token: dict = Depends(verify_token)):
    """
    Cancelar una reserva cambiando su estado a "cancelada".
    - Solo puede cancelar reservas asociadas a su propio departamento.
    - `estado_reserva = 2` corresponde a "cancelada".
    """
    id_departamento = token["sub"]
    conn = await get_connection()

    result = await conn.execute("""
        UPDATE reserva
        SET estado_reserva = 2
        WHERE id = $1 AND id_departamento = $2
    """, id_reserva, id_departamento)

    await conn.close()

    if result == "UPDATE 0":
        raise HTTPException(
            status_code=404,
            detail="Reserva no encontrada o no pertenece a este departamento"
        )

    return {"message": f"Reserva {id_reserva} cancelada"}
