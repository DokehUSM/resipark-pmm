from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from datetime import datetime, timezone
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
    
class CrearReservaRequest(BaseModel):
    hora_inicio: datetime
    hora_termino: datetime
    placa_patente_visitante: str
    numero_estacionamiento: int
    numero_departamento: int

@router.post("/reservas", status_code=201)
def crear_reserva(payload: CrearReservaRequest, db: Session = Depends(get_db)):
    if payload.hora_termino <= payload.hora_inicio:
        raise HTTPException(status_code=400, detail="hora_termino debe ser mayor que hora_inicio")

    # 1) Verificar vehículo visitante (FK exige fila previa)
    existe_row = db.execute(
        text("SELECT 1 FROM vehiculo_visitante WHERE placa_patente = :placa"),
        {"placa": payload.placa_patente_visitante},
    ).fetchone()
    if existe_row is None:
        raise HTTPException(status_code=400, detail="Vehículo visitante no registrado")

    # 2) Validar solapamientos de reserva
    solapa_row = db.execute(text("""
        SELECT 1
        FROM reserva_estacionamiento
        WHERE numero_estacionamiento = :estac
          AND tstzrange(hora_inicio, hora_termino, '[)') && tstzrange(:ini, :fin, '[)')
          AND estado IN ('pendiente','confirmada','ocupado')
        LIMIT 1
    """), {
        "estac": payload.numero_estacionamiento,
        "ini": payload.hora_inicio,
        "fin": payload.hora_termino,
    }).fetchone()
    if solapa_row is not None:
        raise HTTPException(status_code=409, detail="Existe una reserva que se solapa en ese estacionamiento")

    # 3) Si está físicamente ocupado ahora, impedir reservas que comienzan ahora
    ocupado_row = db.execute(text("""
        SELECT 1 FROM registro_ingreso
        WHERE numero_estacionamiento = :estac AND hora_salida IS NULL
        LIMIT 1
    """), {"estac": payload.numero_estacionamiento}).fetchone()

    ahora = datetime.now(timezone.utc)
    empieza_ahora = payload.hora_inicio <= ahora <= payload.hora_termino

    if ocupado_row is not None and empieza_ahora:
        raise HTTPException(status_code=409, detail="El estacionamiento está ocupado en este momento")

    # 4) Estado y hora_reserva
    estado = "ocupado" if empieza_ahora else "pendiente"
    hora_reserva = payload.hora_inicio  # igual a hora_inicio

    # 5) Insert de la reserva
    res = db.execute(text("""
        INSERT INTO reserva_estacionamiento
            (hora_reserva, hora_inicio, hora_termino, estado,
             placa_patente_visitante, numero_estacionamiento, numero_departamento, rut_conserje)
        VALUES
            (:res, :ini, :fin, :est, :placa, :estac, :dep, NULL)
        RETURNING id_reserva
    """), {
        "res": hora_reserva,
        "ini": payload.hora_inicio,
        "fin": payload.hora_termino,
        "est": estado,
        "placa": payload.placa_patente_visitante,
        "estac": payload.numero_estacionamiento,
        "dep": payload.numero_departamento,
    })

    res_row = res.fetchone()
    if res_row is None:
        db.rollback()
        raise HTTPException(status_code=500, detail="No se pudo crear la reserva")

    reserva_id = res_row[0]

    # 6) Si debe quedar “ocupado”, abrir registro_ingreso para que /disponibilidad lo muestre como ocupado
    id_registro = None
    if estado == "ocupado":
        reg = db.execute(text("""
            INSERT INTO registro_ingreso (hora_entrada, metodo_ingreso, placa_patente, numero_estacionamiento)
            VALUES (:entrada, :metodo, :placa, :estac)
            RETURNING id_registro
        """), {
            "entrada": max(ahora, payload.hora_inicio),
            "metodo": "reserva",
            "placa": payload.placa_patente_visitante,
            "estac": payload.numero_estacionamiento,
        })
        reg_row = reg.fetchone()
        if reg_row is None:
            db.rollback()
            raise HTTPException(status_code=500, detail="Reserva creada pero no se pudo abrir el registro de ingreso")
        id_registro = reg_row[0]

    db.commit()
    return {
        "message": "Reserva creada",
        "id_reserva": reserva_id,
        "estado": estado,
        "registro_ingreso_id": id_registro,
    }

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
