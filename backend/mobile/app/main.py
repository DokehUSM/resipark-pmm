from fastapi import FastAPI

from app.db import get_connection
from app.routers import auth, vehiculos, reservas, estacionamientos, historial

app = FastAPI(title="Backend Mobile API")

app.include_router(auth.router)
app.include_router(vehiculos.router)
app.include_router(reservas.router)
app.include_router(estacionamientos.router)
# app.include_router(historial.router)


@app.get("/")
def root():
    return {"message": "API Mobile funcionando"}


@app.get("/disponibilidad")
async def disponibilidad_publica():
    """Devuelve el estado de cada estacionamiento para el dashboard publico."""
    conn = await get_connection()

    rows = await conn.fetch(
        "SELECT id, ocupado FROM estacionamiento ORDER BY id"
    )
    reservas_activas = await conn.fetchval(
        """
        SELECT COUNT(*)
          FROM reserva
         WHERE estado_reserva = 0
           AND hora_termino > NOW()
        """
    )

    await conn.close()

    reservas_pendientes = int(reservas_activas or 0)
    data = []
    for idx, row in enumerate(rows, start=1):
        ocupado = bool(row["ocupado"])
        if ocupado:
            estado = "ocupado"
        elif reservas_pendientes > 0:
            estado = "reservado"
            reservas_pendientes -= 1
        else:
            estado = "libre"

        data.append({
            "numero": idx,
            "estado": estado,
        })

    return data
