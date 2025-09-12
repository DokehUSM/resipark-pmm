from fastapi import FastAPI
from app.routers import router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Backend Parking Availability API")

# Incluir rutas
app.include_router(router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5500",     # VSCode Live Server
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def root():
    return {"message": "API Web funcionando 🚀"}
