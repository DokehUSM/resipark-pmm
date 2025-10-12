# backend/web/app/routers.py
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import SessionLocal
from app.models import Conserje

# Router agregador
router = APIRouter()

# --- dependencia DB (una sola) ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ================================
# Subrouter: Conserjes
# ================================
conserjes = APIRouter(prefix="/conserjes", tags=["Conserjes"])

@conserjes.get("/")
def listar_conserjes(db: Session = Depends(get_db)):
    return db.query(Conserje).all()

# ================================
# Subrouter: Departamentos
# ================================
departamentos = APIRouter(prefix="/departamentos", tags=["Departamentos"])

@departamentos.get("/")
def listar_departamentos(db: Session = Depends(get_db)):
    rows = db.execute(
        text("""
            SELECT id
              FROM departamento
          ORDER BY id
        """)
    ).mappings().all()
    return [dict(r) for r in rows]

# ================================
# Subrouter: Placas
# ================================
placas = APIRouter(prefix="/placas", tags=["Placas"])

@placas.get("/")
def listar_placas(q: str | None = None, db: Session = Depends(get_db)):
    sql = """
      SELECT
        v.placa_patente AS id,
        v.id_departamento AS depto,
        v.placa_patente AS patente,
        v.tipo_vehiculo   AS tipo_vehiculo
      FROM vehiculo v
    """
    params = {}
    if q:
        sql += " WHERE v.placa_patente ILIKE :q OR v.id_departamento ILIKE :q"
        params["q"] = f"%{q}%"
    sql += " ORDER BY v.id_departamento, v.placa_patente"
    rows = db.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]

@placas.put("/{patente_actual}")
def actualizar_vehiculo(
    patente_actual: str,
    payload: dict,
    db: Session = Depends(get_db),
):
    """
    Body (todos opcionales):
    {
      "patente": "NUEVA123",     # nueva patente
      "tipo_vehiculo": 1         # nuevo tipo (int)
    }
    """
    nueva_patente = payload.get("patente")
    nuevo_tipo = payload.get("tipo_vehiculo")

    # verificar existencia
    row = db.execute(
        text("SELECT placa_patente FROM vehiculo WHERE placa_patente = :p"),
        {"p": patente_actual},
    ).fetchone()
    if not row:
        raise HTTPException(404, "Vehículo no encontrado")

    # si cambia patente, verificar referencias
    if nueva_patente and nueva_patente != patente_actual:
        # ¿ya existe la nueva?
        ya = db.execute(
            text("SELECT 1 FROM vehiculo WHERE placa_patente = :p"),
            {"p": nueva_patente},
        ).fetchone()
        if ya:
            raise HTTPException(409, "La nueva patente ya existe")

        ref = db.execute(
            text("""
                SELECT 1
                FROM registro_evento_acceso
                WHERE placa_patente_vehiculo = :p
                LIMIT 1
            """),
            {"p": patente_actual},
        ).fetchone()
        if ref:
            raise HTTPException(
                409,
                "No se puede cambiar la patente porque tiene eventos referenciados. (Cree un nuevo vehículo o deje esta patente tal cual).",
            )

        # actualizar PK
        db.execute(
            text("""
                UPDATE vehiculo
                   SET placa_patente = :nueva
                 WHERE placa_patente = :vieja
            """),
            {"nueva": nueva_patente, "vieja": patente_actual},
        )
        patente_actual = nueva_patente  # seguir usando el valor nuevo

    # actualizar tipo si viene
    if nuevo_tipo is not None:
        db.execute(
            text("""
                UPDATE vehiculo
                   SET tipo_vehiculo = :t
                 WHERE placa_patente = :p
            """),
            {"t": nuevo_tipo, "p": patente_actual},
        )

    db.commit()

    # devolver fila actualizada
    row = db.execute(
        text("""
            SELECT
              placa_patente AS id,
              id_departamento AS depto,
              placa_patente   AS patente,
              tipo_vehiculo
            FROM vehiculo
            WHERE placa_patente = :p
        """),
        {"p": patente_actual},
    ).mappings().one()
    return dict(row)


# ================================
# Subrouter: Historial
# ================================
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

# ===============================
# Subrouter: Home / Reservas
# ===============================
home = APIRouter(prefix="", tags=["Home / Reservas"])

def now_tz():
    return datetime.now(timezone.utc)

@home.get("/dashboard/estados")
def dashboard_estados(db: Session = Depends(get_db)):
    """
    Estado por estacionamiento:
    - 1 ocupado (rojo) si estacionamiento.ocupado = TRUE
    - 2 reservado (amarillo) si existe reserva activa con id_estacionamiento
    - 0 libre (verde) en otro caso
    """
    sql = """
    WITH reservas_asignadas AS (
      SELECT id_estacionamiento
      FROM reserva
      WHERE estado_reserva = 0
        AND hora_termino > NOW()
        AND id_estacionamiento IS NOT NULL
      GROUP BY id_estacionamiento
    )
    SELECT
      e.id,
      CASE
        WHEN e.ocupado = TRUE THEN 1
        WHEN ra.id_estacionamiento IS NOT NULL THEN 2
        ELSE 0
      END AS estado
    FROM estacionamiento e
    LEFT JOIN reservas_asignadas ra ON ra.id_estacionamiento = e.id
    ORDER BY e.id;
    """
    rows = db.execute(text(sql)).mappings().all()
    def label(n): return {0: "libre", 1: "ocupado", 2: "reservado"}.get(n, "desconocido")
    return [{"id": r["id"], "estado": r["estado"], "estado_label": label(r["estado"])} for r in rows]

@home.post("/reservas", status_code=201)
def crear_reserva(payload: dict, db: Session = Depends(get_db)):
    """
    Body:
    {
      "patente": "ZZZZ99",
      "rut": "98765432-1",
      "depto": "1108A",
      "hora_inicio": "2025-09-19T16:30:00Z",
      "hora_termino": "2025-09-19T17:30:00Z",
      "rut_conserje": "12345678-9"   (opcional)
    }
    """
    for f in ["patente", "rut", "depto", "hora_inicio", "hora_termino"]:
        if f not in payload:
            raise HTTPException(400, f"Falta campo: {f}")

    totales = db.execute(text("SELECT COUNT(*) FROM estacionamiento")).scalar() or 0
    reservas_activas = db.execute(text("""
      SELECT COUNT(*)
      FROM reserva
      WHERE estado_reserva = 0
        AND hora_termino > NOW()
    """)).scalar() or 0
    ocupados = db.execute(text("SELECT COUNT(*) FROM estacionamiento WHERE ocupado = TRUE")).scalar() or 0

    if reservas_activas >= totales:
        raise HTTPException(400, "No se pueden crear más reservas: todas ya están reservadas")
    if ocupados >= totales:
        raise HTTPException(400, "No se pueden crear reservas: todos los estacionamientos están ocupados")

    res = db.execute(text("""
      INSERT INTO reserva(
        hora_inicio, hora_termino, estado_reserva,
        rut_visitante, placa_patente_visitante,
        id_departamento, rut_conserje, id_estacionamiento
      ) VALUES (
        :hora_inicio, :hora_termino, 0,
        :rut, :patente,
        :depto, :rut_conserje, NULL
      )
      RETURNING id
    """), {
        "hora_inicio": payload["hora_inicio"],
        "hora_termino": payload["hora_termino"],
        "rut": payload["rut"],
        "patente": payload["patente"],
        "depto": payload["depto"],
        "rut_conserje": payload.get("rut_conserje"),
    }).fetchone()
    db.commit()
    return {"id_reserva": res[0], "estado": "activa"}

@home.get("/reservas/pendientes")
def reservas_pendientes(db: Session = Depends(get_db)):
    rows = db.execute(text("""
      SELECT id, id_departamento AS depto, placa_patente_visitante AS patente,
             rut_visitante AS rut, hora_inicio, hora_termino
      FROM reserva
      WHERE estado_reserva = 0
        AND hora_termino > NOW()
        AND id_estacionamiento IS NULL
      ORDER BY hora_inicio ASC
    """)).mappings().all()
    return [dict(r) for r in rows]

@home.get("/reservas/asignadas")
def reservas_asignadas(db: Session = Depends(get_db)):
    rows = db.execute(text("""
      SELECT id, id_departamento AS depto, placa_patente_visitante AS patente,
             rut_visitante AS rut, hora_inicio, hora_termino, id_estacionamiento AS est
      FROM reserva
      WHERE estado_reserva = 0
        AND hora_termino > NOW()
        AND id_estacionamiento IS NOT NULL
      ORDER BY hora_inicio ASC
    """)).mappings().all()
    return [dict(r) for r in rows]

@home.post("/reservas/{id_reserva}/asignar")
def asignar_estacionamiento(id_reserva: int, payload: dict, db: Session = Depends(get_db)):
    est = payload.get("id_estacionamiento")
    if not est:
        raise HTTPException(400, "Falta id_estacionamiento")

    r = db.execute(text("""
      SELECT id FROM reserva
      WHERE id = :id AND estado_reserva = 0 AND hora_termino > NOW()
    """), {"id": id_reserva}).fetchone()
    if not r:
        raise HTTPException(404, "Reserva no activa o vencida")

    row_est = db.execute(text("SELECT ocupado FROM estacionamiento WHERE id = :id"), {"id": est}).fetchone()
    if not row_est:
        raise HTTPException(404, "Estacionamiento no existe")

    ya = db.execute(text("""
      SELECT 1 FROM reserva
      WHERE estado_reserva = 0
        AND hora_termino > NOW()
        AND id_estacionamiento = :est
      LIMIT 1
    """), {"est": est}).fetchone()
    if ya:
        raise HTTPException(400, "Estacionamiento ya está reservado por otra reserva activa")

    db.execute(text("UPDATE reserva SET id_estacionamiento = :est WHERE id = :id"),
               {"est": est, "id": id_reserva})
    db.commit()
    return {"ok": True, "mensaje": f"Reserva {id_reserva} asignada a {est}"}

@home.post("/reservas/{id_reserva}/desasignar")
def desasignar_estacionamiento(id_reserva: int, db: Session = Depends(get_db)):
    res = db.execute(text("""
      UPDATE reserva
         SET id_estacionamiento = NULL
       WHERE id = :id
         AND estado_reserva = 0
    """), {"id": id_reserva})
    db.commit()
    if res.rowcount == 0:
        raise HTTPException(404, "Reserva no encontrada o no activa")
    return {"ok": True, "mensaje": f"Reserva {id_reserva} desasignada"}

@home.delete("/reservas/{id_reserva}")
def cancelar_reserva(id_reserva: int, db: Session = Depends(get_db)):
    res = db.execute(text("""
      UPDATE reserva
         SET estado_reserva = 2, id_estacionamiento = NULL
       WHERE id = :id
    """), {"id": id_reserva})
    db.commit()
    if res.rowcount == 0:
        raise HTTPException(404, "Reserva no encontrada")
    return {"ok": True, "mensaje": f"Reserva {id_reserva} cancelada"}

# ================================
# Incluir subrouters
# ================================
router.include_router(conserjes)
router.include_router(departamentos)
router.include_router(placas)
router.include_router(historial)
router.include_router(home)
