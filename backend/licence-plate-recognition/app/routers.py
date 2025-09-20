from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import Usuario

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import SessionLocal
from sqlalchemy import text
from typing import Dict, Any

router = APIRouter()

# Dependencia: obtener sesión de BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/usuarios")
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()
    

@router.get("/verificar-patente/{patente}/{tipo_vehiculo}")
def verificar_patente(patente: str, tipo_vehiculo: int, db: Session = Depends(get_db)):
    """
    Verifica si una patente y tipo de vehículo pertenecen a un residente o a un visitante con reserva.
    """
    try:
        # 1. Primero busca en la tabla vehiculo (residentes) con tipo EXACTO
        query_vehiculo = text("""
            SELECT v.placa_patente, v.tipo_vehiculo, v.id_departamento, d.id as depto_id
            FROM vehiculo v
            JOIN departamento d ON v.id_departamento = d.id
            WHERE v.placa_patente = :patente 
            AND v.tipo_vehiculo = :tipo_vehiculo
        """)
        
        vehiculo = db.execute(query_vehiculo, {
            "patente": patente,
            "tipo_vehiculo": tipo_vehiculo
        }).fetchone()
        
        if vehiculo:
            return {
                "existe": True,
                "tipo": "residente",
                "valido": True,
                "datos": {
                    "placa_patente": vehiculo.placa_patente,
                    "tipo_vehiculo": vehiculo.tipo_vehiculo,
                    "departamento": vehiculo.id_departamento
                },
                "mensaje": "Vehículo residente válido"
            }
        
        # 2. Verificar si la patente existe pero con tipo diferente
        query_vehiculo_solo_patente = text("""
            SELECT v.placa_patente, v.tipo_vehiculo, v.id_departamento
            FROM vehiculo v
            WHERE v.placa_patente = :patente
        """)
        
        vehiculo_solo_patente = db.execute(query_vehiculo_solo_patente, {
            "patente": patente
        }).fetchone()
        
        if vehiculo_solo_patente:
            return {
                "existe": True,
                "tipo": "residente",
                "valido": False,
                "datos": {
                    "placa_patente": vehiculo_solo_patente.placa_patente,
                    "tipo_vehiculo_real": vehiculo_solo_patente.tipo_vehiculo,
                    "tipo_vehiculo_solicitado": tipo_vehiculo,
                    "departamento": vehiculo_solo_patente.id_departamento
                },
                "mensaje": "Vehículo residente encontrado pero tipo no coincide"
            }
        
        # 3. Si no es residente, verifica si es visitante con reserva activa
        query_reserva = text("""
            SELECT r.placa_patente_visitante, r.rut_visitante, r.id_departamento,
                r.hora_inicio, r.hora_termino, er.nombre as estado_reserva
            FROM reserva r
            JOIN estado_reserva er ON r.estado_reserva = er.id
            WHERE r.placa_patente_visitante = :patente
            AND r.hora_inicio <= NOW()
            AND r.hora_termino >= NOW()
            AND r.estado_reserva = 0 
            LIMIT 1
        """)
        
        reserva = db.execute(query_reserva, {"patente": patente}).fetchone()
        
        if reserva:
            return {
                "existe": True,
                "tipo": "visitante",
                "valido": True,
                "datos": {
                    "placa_patente": reserva.placa_patente_visitante,
                    "rut_visitante": reserva.rut_visitante,
                    "departamento_visitado": reserva.id_departamento,
                    "hora_inicio": reserva.hora_inicio.isoformat() if reserva.hora_inicio else None,
                    "hora_termino": reserva.hora_termino.isoformat() if reserva.hora_termino else None,
                    "estado_reserva": reserva.estado_reserva
                },
                "mensaje": "Visitante con reserva activa encontrado"
            }
        
        # 4. Si no encuentra en ninguna tabla
        return {
            "existe": False,
            "valido": False,
            "mensaje": "Patente no encontrada en residentes ni visitantes con reserva activa"
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al verificar patente: {str(e)}")



@router.post("/registrar-ingreso-residente/{patente}")
def registrar_ingreso_residente(
    patente: str, 
    db: Session = Depends(get_db)
):
    """
    Registra el INGRESO de un vehículo RESIDENTE en registro_evento_acceso.
    """
    try:
        # Verificar que es residente y obtener datos
        query_vehiculo = text("""
            SELECT v.placa_patente, v.tipo_vehiculo, v.id_departamento
            FROM vehiculo v
            WHERE v.placa_patente = :patente
        """)
        
        vehiculo = db.execute(query_vehiculo, {"patente": patente}).fetchone()
        
        if not vehiculo:
            raise HTTPException(
                status_code=400,
                detail="La patente no corresponde a un vehículo residente"
            )
        
        # Insertar registro para residente (con placa_patente_vehiculo)
        query_registro = text("""
            INSERT INTO registro_evento_acceso 
            (hora, tipo, metodo, placa_detectada, placa_patente_vehiculo)
            VALUES (NOW(), 1, 1, :patente, :patente)
            RETURNING id
        """)
        
        resultado = db.execute(query_registro, {"patente": patente})
        db.commit()
        
        registro_id = resultado.fetchone().id
        
        return {
            "success": True,
            "id_registro": registro_id,
            "departamento": vehiculo.id_departamento,
            "tipo_vehiculo": vehiculo.tipo_vehiculo,
            "mensaje": f"Vehículo residente {patente} ingresado exitosamente. Departamento: {vehiculo.id_departamento}"
        }
            
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar ingreso residente: {str(e)}")


@router.post("/registrar-ingreso-visitante/{patente}")
def registrar_ingreso_visitante(
    patente: str, 
    db: Session = Depends(get_db)
):
    """
    Registra el INGRESO de un vehículo VISITANTE en registro_evento_acceso.
    """
    try:
        # Obtener información de la reserva activa INCLUYENDO el ID
        query_reserva = text("""
            SELECT r.id, r.placa_patente_visitante, r.rut_visitante, r.id_departamento,
                r.hora_inicio, r.hora_termino, er.nombre as estado_reserva
            FROM reserva r
            JOIN estado_reserva er ON r.estado_reserva = er.id
            WHERE r.placa_patente_visitante = :patente
            AND r.hora_inicio <= NOW()
            AND r.hora_termino >= NOW()
            AND r.estado_reserva = 0 
            LIMIT 1
        """)
        
        reserva = db.execute(query_reserva, {"patente": patente}).fetchone()
        
        if not reserva:
            raise HTTPException(
                status_code=400,
                detail="No se encontró una reserva activa para esta patente"
            )
        
        # Insertar registro para visitante (con id_reserva)
        query_registro = text("""
            INSERT INTO registro_evento_acceso 
            (hora, tipo, metodo, placa_detectada, id_reserva, placa_patente_vehiculo)
            VALUES (NOW(), 1, 1, :patente, :id_reserva, NULL)
            RETURNING id
        """)
        
        resultado = db.execute(query_registro, {
            "patente": patente,
            "id_reserva": reserva.id  # ← Usamos el ID de la reserva
        })
        db.commit()
        
        registro_id = resultado.fetchone().id
        
        return {
            "success": True,
            "id_registro": registro_id,
            "id_reserva": reserva.id,
            "departamento_visitado": reserva.id_departamento,
            "rut_visitante": reserva.rut_visitante,
            "hora_inicio_reserva": reserva.hora_inicio.isoformat(),
            "hora_termino_reserva": reserva.hora_termino.isoformat(),
            "mensaje": f"Vehículo visitante {patente} ingresado exitosamente. Departamento: {reserva.id_departamento}"
        }
            
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar ingreso visitante: {str(e)}")