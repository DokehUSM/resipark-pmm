# app/routers/estacionamientos.py
from fastapi import APIRouter, Depends
from app.db import get_connection
from app.auth_utils import verify_token

router = APIRouter(prefix="/estacionamientos", tags=["Estacionamientos"])

@router.get("/disponibilidad")
async def disponibilidad_estacionamientos(token: dict = Depends(verify_token)):
    """
    Consulta la disponibilidad global de estacionamientos de visita.
    Devuelve solo los totales (sin detalle por número).
    """
    conn = await get_connection()

    # 1. Total de estacionamientos
    total = await conn.fetchval("SELECT COUNT(*) FROM estacionamiento")

    # 2. Ocupados (último evento = ocupado)
    ocupados = await conn.fetchval("""
        WITH ultimos_eventos AS (
            SELECT DISTINCT ON (numero_estacionamiento)
                   numero_estacionamiento, tipo
            FROM registro_evento_estacionamiento
            ORDER BY numero_estacionamiento, hora DESC
        )
        SELECT COUNT(*) FROM ultimos_eventos
        WHERE tipo = 0  -- ocupado
    """)

    # 3. Reservas activas (vigentes ahora o futuras)
    reservados = await conn.fetchval("""
        SELECT COUNT(*) 
        FROM reserva
        WHERE estado_reserva = 0  -- activa
          AND hora_termino > NOW()
    """)

    await conn.close()

    # 4. Disponibles = total - ocupados - reservados
    disponibles = max(total - ocupados - reservados, 0)

    return {
        "total": total,
        "ocupados": ocupados,
        "reservados": reservados,
        "disponibles": disponibles
    }
