from fastapi import FastAPI
from app.routers import auth, vehiculos, reservas, estacionamientos, historial

app = FastAPI(title="Backend Mobile API")

app.include_router(auth.router)
app.include_router(vehiculos.router)
app.include_router(reservas.router)
app.include_router(estacionamientos.router)
# app.include_router(historial.router)

@app.get("/")
def root():
    return {"message": "API Mobile funcionando 🚀"}
