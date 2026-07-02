import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()  # charge backend/.env en local ; en prod Render injectera la variable

URL_BASE = os.getenv("DATABASE_URL")
if not URL_BASE:
    raise RuntimeError("DATABASE_URL manquante — créer backend/.env")

engine = create_engine(URL_BASE)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()