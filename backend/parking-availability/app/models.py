from sqlalchemy import Column, Integer, TIMESTAMP
from .db import Base

class EstacionamientoEstado(Base):
    __tablename__ = "estacionamiento_estado"

    estacionamiento_numero = Column(Integer, primary_key=True, index=True)
    estado = Column(Integer, nullable=False)  
    updated_at = Column(TIMESTAMP, nullable=False)
