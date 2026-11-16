from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


# ---- Ce que le client de l'API envoie ----

class LigneFactureCreation(BaseModel):
    article_id: int
    quantite: int = Field(gt=0)   # au moins 1, jamais négatif


class ClientFacture(BaseModel):
    """Infos client saisies au moment de la vente."""
    nom: str = Field(min_length=1, max_length=100)
    prenom: str | None = Field(default=None, max_length=100)
    telephone: str = Field(min_length=7, max_length=20)
    adresse: str | None = Field(default=None, max_length=255)


class FactureCreation(BaseModel):
    client: ClientFacture
    lignes: list[LigneFactureCreation] = Field(min_length=1)


# ---- Ce que l'API renvoie ----

class LigneFactureLecture(BaseModel):
    id: int
    article_id: int
    designation: str
    prix_unitaire_ht: Decimal
    quantite: int
    montant_ht: Decimal

    class Config:
        from_attributes = True

class PaiementCreation(BaseModel):
    montant: Decimal = Field(gt=0, decimal_places=2)
    mode: str = Field(pattern="^(especes|wave|orange_money|virement)$")


class ValidationFacture(BaseModel):
    """Paiement optionnel encaissé au moment de la validation."""
    paiement: PaiementCreation | None = None


class PaiementLecture(BaseModel):
    id: int
    montant: Decimal
    mode: str
    date_paiement: datetime

    class Config:
        from_attributes = True

class ClientLectureFacture(BaseModel):
    id: int
    nom: str
    prenom: str | None = None
    telephone: str

    class Config:
        from_attributes = True
class FactureLecture(BaseModel):
    id: int
    numero: str
    date_creation: datetime
    statut: str
    client: ClientLectureFacture
    nb_reouvertures: int = 0
    date_derniere_modification: datetime | None = None
    client_id: int
    total_ht: Decimal
    total_tva: Decimal
    total_ttc: Decimal
    lignes: list[LigneFactureLecture]
    paiements: list[PaiementLecture] = []
    montant_paye: Decimal
    reste_a_payer: Decimal
    statut_paiement: str

    class Config:
        from_attributes = True


class FactureReponse(BaseModel):
    """Enveloppe : la facture créée + les alertes d'articles indisponibles."""
    facture: FactureLecture
    articles_indisponibles: list[str] = []