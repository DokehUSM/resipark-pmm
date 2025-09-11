from fastapi import FastAPI
from app.routers import router

app = FastAPI(title="Backend Licence Plate Recognition API")

# Incluir rutas
app.include_router(router)

@app.get("/")
def root():
    return {"message": "API Web funcionando 🚀"}
