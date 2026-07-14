from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class LigneFacture(Base):
    __tablename__ = "lignes_facture"

    id = Column(Integer, primary_key=True, index=True)
    facture_id = Column(Integer, ForeignKey("factures.id"), nullable=False)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)

    # Snapshot au moment de la vente (jamais de référence au prix courant !)
    designation = Column(String(200), nullable=False)
    prix_unitaire_ht = Column(Numeric(12, 2), nullable=False)
    quantite = Column(Integer, nullable=False)
    montant_ht = Column(Numeric(14, 2), nullable=False)

    facture = relationship("Facture", back_populates="lignes")
    article = relationship("Article")