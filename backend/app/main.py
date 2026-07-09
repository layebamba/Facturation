from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import articles
from app.database import Base, engine
from app import models # important : enregistre le modèle

Base.metadata.create_all(bind=engine)
app = FastAPI(
    title="Facturation API",
    description="Gestion de facturation et stock pour boutiques",
    version="0.1.0",
)

# CORS : autorise le front Vite en local (leçon retenue de BuyGuinar 😉)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "https://facturation-eosin.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(articles.router)


@app.get("/")
def racine():
    return {"statut": "ok", "app": "Facturation Boutique"}