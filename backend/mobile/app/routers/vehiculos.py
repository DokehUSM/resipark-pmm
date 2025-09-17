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
    tipo_vehiculo: int   # Ejemplo: 1 = auto, 2 = camioneta, 3 = taxi, etc.

class UpdateVehiculoRequest(BaseModel):
    tipo_vehiculo: int   # Solo se puede actualizar el tipo de vehículo

# ------------------------
# Crear vehículo
# ------------------------
@router.post("/", status_code=201)
async def agregar_vehiculo(req: VehiculoRequest, token: dict = Depends(verify_token)):
    """
    Crea o actualiza un vehículo asociado al residente autenticado.
    
    - El `id_departamento` se obtiene desde el token JWT (sub).
    - Si la placa ya existe en la BD, se actualiza su `tipo_vehiculo` y se asegura 
      que quede asociado al departamento del usuario logueado.
    - Los códigos de `tipo_vehiculo` corresponden a una clasificación definida 
      (ej: 1 = auto, 2 = camioneta, 3 = taxi, ...).
    """
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
async def listar_vehiculos(token: dict = Depends(verify_token)):
    """
    Devuelve todos los vehículos asociados al residente autenticado.
    
    - El sistema filtra por `id_departamento` para que un usuario solo 
      pueda ver sus propios vehículos.
    - Se devuelve una lista de objetos con `placa_patente` y `tipo_vehiculo`.
    """
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
async def actualizar_vehiculo(placa: str, req: UpdateVehiculoRequest, token: dict = Depends(verify_token)):
    """
    Actualiza el tipo de vehículo de una placa registrada por el residente autenticado.
    
    - Solo se puede modificar el `tipo_vehiculo`.
    - La query valida que la placa pertenezca al `id_departamento` del usuario 
      para evitar modificar autos de otros residentes.
    - Si no existe el vehículo, devuelve 404.
    """
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

    if result.endswith("0"):  # Ninguna fila afectada
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    return {"mensaje": "Vehículo actualizado", "placa": placa}

# ------------------------
# Eliminar vehículo
# ------------------------
@router.delete("/{placa}")
async def eliminar_vehiculo(placa: str, token: dict = Depends(verify_token)):
    """
    Elimina un vehículo del residente autenticado.
    
    - Solo se permite eliminar vehículos que pertenezcan al `id_departamento` del usuario.
    - Si la placa no existe o no corresponde al residente, devuelve 404.
    """
    id_departamento = token["sub"]

    conn = await get_connection()
    try:
        result = await conn.execute("""
            DELETE FROM vehiculo
            WHERE placa_patente = $1 AND id_departamento = $2
        """, placa, id_departamento)
    finally:
        await conn.close()

    if result.endswith("0"):  # Ninguna fila afectada
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    return {"mensaje": "Vehículo eliminado", "placa": placa}
