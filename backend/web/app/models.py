from sqlalchemy import Column, String
from app.db import Base

class Conserje(Base):
    __tablename__ = "conserje"
    rut = Column(String, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
