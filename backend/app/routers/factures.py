from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Facture
from app.schemas.facture import FactureCreation, FactureLecture, FactureReponse, LigneFactureCreation
from app.services.facture_service import (
    creer_facture, ajouter_lignes, valider_facture,
    rouvrir_facture, retirer_ligne,
)

router = APIRouter(prefix="/factures", tags=["Factures"])


@router.post("", response_model=FactureReponse, status_code=201)
def creer(donnees: FactureCreation, db: Session = Depends(get_db)):
    facture, alertes = creer_facture(db, donnees)
    return FactureReponse(facture=facture, articles_indisponibles=alertes)


@router.get("", response_model=list[FactureLecture])
def lister_factures(db: Session = Depends(get_db)):
    return db.query(Facture).order_by(Facture.date_creation.desc()).all()


@router.get("/{facture_id}", response_model=FactureLecture)
def obtenir_facture(facture_id: int, db: Session = Depends(get_db)):
    facture = db.query(Facture).filter(Facture.id == facture_id).first()
    if not facture:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    return facture

@router.post("/{facture_id}/rouvrir", response_model=FactureLecture)
def rouvrir(facture_id: int, db: Session = Depends(get_db)):
    return rouvrir_facture(db, facture_id)


@router.delete("/{facture_id}/lignes/{ligne_id}", response_model=FactureLecture)
def supprimer_ligne(facture_id: int, ligne_id: int, db: Session = Depends(get_db)):
    return retirer_ligne(db, facture_id, ligne_id)

@router.post("/{facture_id}/lignes", response_model=FactureReponse)
def ajouter_articles(
        facture_id: int,
        lignes: list[LigneFactureCreation],
        db: Session = Depends(get_db),
):
    facture, alertes = ajouter_lignes(db, facture_id, lignes)
    return FactureReponse(facture=facture, articles_indisponibles=alertes)


@router.post("/{facture_id}/valider", response_model=FactureLecture)
def valider(facture_id: int, db: Session = Depends(get_db)):
    return valider_facture(db, facture_id)