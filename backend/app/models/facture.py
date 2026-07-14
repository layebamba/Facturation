from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

TAUX_TVA = 0.18  # TVA Sénégal 18%


class Facture(Base):
    __tablename__ = "factures"

    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String(20), unique=True, nullable=False, index=True)
    date_creation = Column(DateTime, default=datetime.utcnow, nullable=False)
    statut = Column(String(10), nullable=False, default="brouillon")
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)

    total_ht = Column(Numeric(14, 2), nullable=False, default=0)
    total_tva = Column(Numeric(14, 2), nullable=False, default=0)
    total_ttc = Column(Numeric(14, 2), nullable=False, default=0)
    nb_reouvertures = Column(Integer, nullable=False, default=0)
    date_derniere_modification = Column(DateTime, nullable=True)

    client = relationship("Client")
    lignes = relationship(
        "LigneFacture",
        back_populates="facture",
        cascade="all, delete-orphan",
    )