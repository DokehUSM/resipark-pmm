from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db import get_connection
from app.auth_utils import create_access_token
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["Auth"])

# --------------------
# Modelo de request
# --------------------
class LoginRequest(BaseModel):
    id_departamento: str   # en tu BD es TEXT, no int
    contrasena: str

# --------------------
# Endpoint de login
# --------------------
@router.post("/login")
async def login(req: LoginRequest):
    """
    Valida credenciales de un departamento.
    - Busca el `id_departamento` en la tabla `departamento`.
    - Compara la contraseña ingresada con el hash almacenado (usando crypt).
    - Si es válido, genera y devuelve un JWT.
    """

    conn = await get_connection()

    row = await conn.fetchrow("""
        SELECT id
        FROM departamento
        WHERE id = $1
        AND contrasena = crypt($2, contrasena)
    """, req.id_departamento, req.contrasena)

    await conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    # Crear token JWT válido por 60 minutos
    token = create_access_token(
        data={"sub": row["id"]},
        expires_delta=timedelta(minutes=60)
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "departamento": row["id"]
    }
