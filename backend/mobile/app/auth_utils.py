import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# ==========================
# CONFIG
# ==========================
SECRET_KEY = os.getenv("SECRET_KEY", "secret-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Esto reemplaza a OAuth2PasswordBearer
security = HTTPBearer()

# ==========================
# CREAR TOKEN
# ==========================
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Genera un JWT firmado con SECRET_KEY."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ==========================
# VERIFICAR TOKEN
# ==========================
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Valida el JWT recibido en el header Authorization: Bearer <token>."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
