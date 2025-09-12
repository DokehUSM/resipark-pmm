from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from app.db import SessionLocal

router = APIRouter()

# --------------------
# Dependencia: obtener sesión de BD
# --------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --------------------
# LOGIN
# --------------------
class LoginRequest(BaseModel):
    numero_departamento: int
    contrasena: str

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    query = text("""
        SELECT numero_departamento
        FROM departamento
        WHERE numero_departamento = :num
        AND crypt(:pwd, hash_contrasena) = hash_contrasena
    """)
    result = db.execute(query, {
        "num": payload.numero_departamento,
        "pwd": payload.contrasena
    }).fetchone()

    if not result:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    return {
        "message": "Login exitoso",
        "departamento": result.numero_departamento
    }

# --------------------
# VEHÍCULOS RESIDENTES
# --------------------
class VehiculoResidenteRequest(BaseModel):
    placa_patente: str
    color: str
    categoria_vehiculo: str
    numero_departamento: int

@router.post("/vehiculos/residente")
def crear_vehiculo_residente(payload: VehiculoResidenteRequest, db: Session = Depends(get_db)):
    db.execute(text("INSERT INTO vehiculo (placa_patente) VALUES (:placa) ON CONFLICT DO NOTHING"),
               {"placa": payload.placa_patente})

    db.execute(text("""
        INSERT INTO vehiculo_residente (placa_patente, color, categoria_vehiculo, numero_departamento)
        VALUES (:placa, :color, :cat, :dep)
        ON CONFLICT (placa_patente) DO UPDATE SET
            color = EXCLUDED.color,
            categoria_vehiculo = EXCLUDED.categoria_vehiculo,
            numero_departamento = EXCLUDED.numero_departamento
    """), {
        "placa": payload.placa_patente,
        "color": payload.color,
        "cat": payload.categoria_vehiculo,
        "dep": payload.numero_departamento
    })

    db.commit()
    return {"message": "Vehículo residente registrado", "placa": payload.placa_patente}

# --------------------
# RESERVAS
# --------------------
class ReservaRequest(BaseModel):
    hora_reserva: str
    hora_inicio: str
    hora_termino: str
    estado: str
    placa_patente_visitante: str
    numero_estacionamiento: int
    numero_departamento: int
    rut_conserje: str | None = None

# @router.post("/reservas")
# def crear_reserva(payload: ReservaRequest, db: Session = Depends(get_db)):
#     query = text("""
#         INSERT INTO reserva_estacionamiento 
#         (hora_reserva, hora_inicio, hora_termino, estado, placa_patente_visitante,
#          numero_estacionamiento, numero_departamento, rut_conserje)
#         VALUES (:res, :ini, :fin, :est, :placa, :estac, :dep, :rut)
#         RETURNING id_reserva
#     """)
#     result = db.execute(query, {
#         "res": payload.hora_reserva,
#         "ini": payload.hora_inicio,
#         "fin": payload.hora_termino,
#         "est": payload.estado,
#         "placa": payload.placa_patente_visitante,
#         "estac": payload.numero_estacionamiento,
#         "dep": payload.numero_departamento,
#         "rut": payload.rut_conserje
#     })
#     db.commit()
#     reserva_id = result.fetchone()[0]
#     return {"message": "Reserva creada", "id_reserva": reserva_id}

# --------------------
# DISPONIBILIDAD
# --------------------
@router.get("/disponibilidad")
def disponibilidad(db: Session = Depends(get_db)):
    """
    Lista los estacionamientos con su estado:
    - 'ocupado' si hay un registro_ingreso activo (sin hora_salida).
    - 'reservado' si existe una reserva futura confirmada/pendiente.
    - 'libre' si no está ocupado ni reservado.
    """
    query = text("""
        SELECT e.numero,
            CASE
                WHEN EXISTS (
                    SELECT 1 FROM registro_ingreso r
                    WHERE r.numero_estacionamiento = e.numero AND r.hora_salida IS NULL
                ) THEN 'ocupado'
                WHEN EXISTS (
                    SELECT 1 FROM reserva_estacionamiento rs
                    WHERE rs.numero_estacionamiento = e.numero
                    AND rs.hora_inicio <= NOW()
                    AND rs.hora_termino >= NOW()
                    AND rs.estado IN ('pendiente', 'confirmada')
                ) THEN 'reservado'
                ELSE 'libre'
            END AS estado
        FROM estacionamiento e
        ORDER BY e.numero
    """)
    result = db.execute(query).mappings().all()
    return {"disponibilidad": result}

# --------------------
# RESERVAS POR DEPARTAMENTO
# --------------------
@router.get("/reservas/{departamento}")
def reservas_departamento(departamento: int, db: Session = Depends(get_db)):
    """
    Devuelve todas las reservas asociadas a un número de departamento.
    """
    query = text("""
        SELECT id_reserva, hora_reserva, hora_inicio, hora_termino,
               estado, placa_patente_visitante, numero_estacionamiento
        FROM reserva_estacionamiento
        WHERE numero_departamento = :dep
        ORDER BY hora_reserva DESC
    """)
    result = db.execute(query, {"dep": departamento}).mappings().all()
    return {"reservas": result}
