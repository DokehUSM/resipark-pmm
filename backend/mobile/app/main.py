from fastapi import FastAPI
from app.routers import router

app = FastAPI(title="Backend Mobile API")

# Incluir rutas
app.include_router(router)

@app.get("/")
def root():
    return {"message": "API Web funcionando 🚀"}
