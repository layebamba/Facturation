from sqlalchemy import Column, Integer, String, Numeric
from sqlalchemy.sql.sqltypes import Boolean

from app.database import Base


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(50), unique=True, nullable=False, index=True)
    designation = Column(String(200), nullable=False)
    prix_unitaire_ht = Column(Numeric(12, 2), nullable=False)
    quantite_stock = Column(Integer, nullable=False, default=0)
    seuil_alerte = Column(Integer, nullable=False, default=5)
    actif = Column(Boolean, nullable=False, server_default="true")