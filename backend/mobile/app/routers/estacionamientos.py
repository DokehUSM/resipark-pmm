# app/routers/estacionamientos.py
from fastapi import APIRouter, Depends

from app.auth_utils import verify_token
from app.db import get_connection

router = APIRouter(prefix="/estacionamientos", tags=["Estacionamientos"])


@router.get("/disponibilidad")
async def disponibilidad_estacionamientos(token: dict = Depends(verify_token)):
    """Consulta la disponibilidad global de estacionamientos de visita."""
    conn = await get_connection()

    total = await conn.fetchval("SELECT COUNT(*) FROM estacionamiento")
    ocupados = await conn.fetchval("SELECT COUNT(*) FROM estacionamiento WHERE ocupado = TRUE")
    reservados = await conn.fetchval(
        """
        SELECT COUNT(*)
          FROM reserva
         WHERE estado_reserva = 0
           AND hora_termino > NOW()
        """
    )

    await conn.close()

    disponibles = max(total - ocupados - reservados, 0)

    return {
        "total": total,
        "ocupados": ocupados,
        "reservados": reservados,
        "disponibles": disponibles,
    }
