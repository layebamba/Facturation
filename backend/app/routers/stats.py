from datetime import datetime, time

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Article, Facture, LigneFacture, Paiement

router = APIRouter(prefix="/stats", tags=["Statistiques"])


@router.get("/tableau-de-bord")
def tableau_de_bord(db: Session = Depends(get_db)):
    maintenant = datetime.utcnow()
    debut_jour = datetime.combine(maintenant.date(), time.min)
    debut_mois = debut_jour.replace(day=1)

    def ventes(debut):
        total, nb = (
            db.query(func.coalesce(func.sum(Facture.total_ttc), 0), func.count(Facture.id))
            .filter(Facture.statut == "validee", Facture.date_creation >= debut)
            .one()
        )
        return {"total": float(total), "nb": nb}

    def encaisse(debut):
        total = (
            db.query(func.coalesce(func.sum(Paiement.montant), 0))
            .filter(Paiement.date_paiement >= debut)
            .scalar()
        )
        return float(total)

    # Impayés : reste à payer sur les factures validées
    validees = (
        db.query(Facture)
        .options(selectinload(Facture.paiements))
        .filter(Facture.statut == "validee")
        .all()
    )
    restes = [f.reste_a_payer for f in validees if f.reste_a_payer > 0]

    brouillons = db.query(func.count(Facture.id)).filter(Facture.statut == "brouillon").scalar()

    stock_alerte = (
        db.query(Article)
        .filter(Article.actif.is_(True), Article.quantite_stock < Article.seuil_alerte)
        .order_by(Article.quantite_stock)
        .limit(10)
        .all()
    )

    top = (
        db.query(
            LigneFacture.designation,
            func.sum(LigneFacture.quantite),
            func.sum(LigneFacture.montant_ht),
        )
        .join(Facture, Facture.id == LigneFacture.facture_id)
        .filter(Facture.statut == "validee", Facture.date_creation >= debut_mois)
        .group_by(LigneFacture.designation)
        .order_by(func.sum(LigneFacture.quantite).desc())
        .limit(5)
        .all()
    )

    return {
        "ventes_jour": ventes(debut_jour),
        "ventes_mois": ventes(debut_mois),
        "encaisse_jour": encaisse(debut_jour),
        "encaisse_mois": encaisse(debut_mois),
        "impayes": {"total": float(sum(restes)), "nb": len(restes)},
        "brouillons": brouillons,
        "stock_alerte": [
            {
                "id": a.id,
                "reference": a.reference,
                "designation": a.designation,
                "quantite_stock": a.quantite_stock,
                "seuil_alerte": a.seuil_alerte,
            }
            for a in stock_alerte
        ],
        "top_articles": [
            {"designation": d, "quantite": int(q), "montant_ht": float(m)} for d, q, m in top
        ],
    }