from decimal import Decimal
from pydantic import BaseModel, Field


class ArticleCreation(BaseModel):
    reference: str = Field(min_length=1, max_length=50)
    designation: str = Field(min_length=1, max_length=200)
    prix_unitaire_ht: Decimal = Field(gt=0, decimal_places=2)
    quantite_stock: int = Field(ge=0, default=0)
    seuil_alerte: int = Field(ge=0, default=5)


class ArticleLecture(BaseModel):
    id: int
    reference: str
    designation: str
    prix_unitaire_ht: Decimal
    quantite_stock: int
    seuil_alerte: int
    actif: bool

    class Config:
        from_attributes = True  # permet de convertir l'objet SQLAlchemy en JSON