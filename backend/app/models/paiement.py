from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base



class Paiement(Base):
    __tablename__ = "paiements"

    id = Column(Integer, primary_key=True, index=True)
    facture_id = Column(Integer, ForeignKey("factures.id"), nullable=False)
    montant = Column(Numeric(14, 2), nullable=False)
    mode = Column(String(20), nullable=False)  # especes | wave | orange_money | virement
    date_paiement = Column(DateTime, default=datetime.utcnow, nullable=False)

    facture = relationship("Facture", back_populates="paiements")