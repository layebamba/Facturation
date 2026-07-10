from sqlalchemy import Column, Integer, String
from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=True)
    telephone = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(150), unique=True, nullable=True)
    adresse = Column(String(255), nullable=True)