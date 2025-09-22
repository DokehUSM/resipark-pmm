# backend/web/app/routers.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import SessionLocal
from app.models import Conserje

router = APIRouter()

# --- dependencia DB ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- subrouter: Conserjes ---
conserjes = APIRouter(prefix="/conserjes", tags=["Conserjes"])

@conserjes.get("/")
def listar_conserjes(db: Session = Depends(get_db)):
    return db.query(Conserje).all()

# --- subrouter: Placas ---
placas = APIRouter(prefix="/placas", tags=["Placas"])

@placas.get("/")
def listar_placas(q: str | None = None, db: Session = Depends(get_db)):
    sql = """
      SELECT
        v.placa_patente AS id,
        v.id_departamento AS depto,
        v.placa_patente AS patente
      FROM vehiculo v
    """
    params = {}
    if q:
        sql += " WHERE v.placa_patente ILIKE :q OR v.id_departamento ILIKE :q"
        params["q"] = f"%{q}%"
    sql += " ORDER BY v.id_departamento, v.placa_patente"
    rows = db.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]

# --- subrouter: Historial ---
historial = APIRouter(prefix="/historial", tags=["Historial"])

@historial.get("/")
def listar_historial(
    q: str | None = None,
    limit: int = 200,
    db: Session = Depends(get_db),
):
    """
    Devuelve eventos de acceso con joins a tipo_evento/metodo_evento y,
    si corresponde, al vehiculo (residente) o a la reserva (visitante).
    Filtro opcional ?q= por patente o departamento.
    """
    sql = """
    SELECT
      a.id,
      a.hora,
      te.nombre AS tipo_evento,
      me.nombre AS metodo_evento,
      a.placa_detectada AS patente,
      v.id_departamento AS depto_residente,
      r.id_departamento AS depto_visitante,
      COALESCE(v.id_departamento, r.id_departamento) AS depto
    FROM registro_evento_acceso a
    JOIN tipo_evento_acceso te ON te.id = a.tipo
    JOIN metodo_evento_acceso me ON me.id = a.metodo
    LEFT JOIN vehiculo v ON v.placa_patente = a.placa_patente_vehiculo
    LEFT JOIN reserva r ON r.id = a.id_reserva
    """
    where = []
    params = {}
    if q:
        where.append("(a.placa_detectada ILIKE :q OR COALESCE(v.id_departamento, r.id_departamento) ILIKE :q)")
        params["q"] = f"%{q}%"
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY a.hora DESC LIMIT :limit"
    params["limit"] = limit

    rows = db.execute(text(sql), params).mappings().all()

    data = []
    for r in rows:
        tipo_evento = (r["tipo_evento"] or "").lower()
        # Heurística simple: si el nombre contiene "ingres" => entrada; si "salid" => salida
        entrada = r["hora"].isoformat() if "ingres" in tipo_evento else None
        salida  = r["hora"].isoformat() if "salid" in tipo_evento else None

        tipo_usuario = "Residente" if r["depto_residente"] else ("Visita" if r["depto_visitante"] else "Desconocido")

        data.append({
            "id": r["id"],
            "patente": r["patente"],
            "tipoUsuario": tipo_usuario,
            "entrada": entrada,
            "salida": salida,
            "depto": r["depto"],
            "metodo": r["metodo_evento"],
            "evento": r["tipo_evento"],
            "hora": r["hora"].isoformat(),
        })
    return data

# Incluir subrouters
router.include_router(conserjes)
router.include_router(placas)
router.include_router(historial)
