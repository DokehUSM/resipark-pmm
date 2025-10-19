from datetime import timedelta

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.auth_utils import create_access_token
from app.db import get_connection

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    correo: str
    contrasena: str


@router.post("/login")
async def login(req: LoginRequest):
    """
    Valida credenciales de un departamento a partir del correo.
    - Busca el correo en la tabla departamento (columna citext).
    - Compara la contrasena ingresada con el hash almacenado (crypt/bcrypt).
    - Si es valido, genera y devuelve un JWT.
    """

    conn = await get_connection()

    row = await conn.fetchrow(
        """
        SELECT id
        FROM departamento
        WHERE correo = $1
          AND contrasena = crypt($2, contrasena)
        """,
        req.correo.strip(),
        req.contrasena,
    )

    await conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Credenciales invalidas")

    token = create_access_token(
        data={"sub": row["id"]},
        expires_delta=timedelta(minutes=60),
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "departamento": row["id"],
    }
