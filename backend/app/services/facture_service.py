from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Article, Client, Facture, LigneFacture, TAUX_TVA
from app.schemas.facture import FactureCreation


def generer_numero(db: Session) -> str:
    """Génère un numéro type FAC-2026-00001, séquentiel par année."""
    annee = datetime.utcnow().year
    prefixe = f"FAC-{annee}-"
    nb = (
        db.query(func.count(Facture.id))
        .filter(Facture.numero.like(f"{prefixe}%"))
        .scalar()
    )
    return f"{prefixe}{nb + 1:05d}"
def obtenir_ou_creer_client(db: Session, infos) -> Client:
    """Retrouve le client par téléphone, sinon le crée. Complète les champs vides."""
    client = db.query(Client).filter(Client.telephone == infos.telephone).first()
    if client:
        # Client connu : on complète ses infos manquantes sans écraser l'existant
        if infos.prenom and not client.prenom:
            client.prenom = infos.prenom
        if infos.adresse and not client.adresse:
            client.adresse = infos.adresse
        return client

    client = Client(
        nom=infos.nom,
        prenom=infos.prenom,
        telephone=infos.telephone,
        adresse=infos.adresse,
    )
    db.add(client)
    db.flush()  # obtient client.id sans committer (reste dans la transaction)
    return client
def creer_facture(db: Session, donnees: FactureCreation):
    # 1. Retrouver ou créer le client (clé : le téléphone)
    client = obtenir_ou_creer_client(db, donnees.client)

    lignes = []
    alertes = []
    total_ht = Decimal("0.00")

    # 2. Traiter chaque ligne
    for ligne in donnees.lignes:
        # Décrément atomique : ne passe que si le stock suffit
        resultat = (
            db.query(Article)
            .filter(
                Article.id == ligne.article_id,
                Article.quantite_stock >= ligne.quantite,
                )
            .update(
                {Article.quantite_stock: Article.quantite_stock - ligne.quantite},
                synchronize_session=False,
            )
        )

        if resultat == 0:
            # Article inexistant ou stock insuffisant → on N'ANNULE PAS,
            # on saute la ligne et on collecte l'alerte
            article = db.query(Article).filter(Article.id == ligne.article_id).first()
            if not article:
                alertes.append(f"Article id={ligne.article_id} introuvable — retiré de la facture")
            else:
                alertes.append(
                    f"'{article.designation}' indisponible "
                    f"(demandé : {ligne.quantite}, en stock : {article.quantite_stock}) — retiré de la facture"
                )
            continue

        # Snapshot de l'article au moment de la vente
        article = db.query(Article).filter(Article.id == ligne.article_id).first()
        montant = article.prix_unitaire_ht * ligne.quantite
        total_ht += montant

        lignes.append(LigneFacture(
            article_id=article.id,
            designation=article.designation,
            prix_unitaire_ht=article.prix_unitaire_ht,
            quantite=ligne.quantite,
            montant_ht=montant,
        ))

    # 3. Cas limite : AUCUNE ligne facturable → pas de facture du tout
    if not lignes:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail={"message": "Aucun article disponible, facture non créée", "alertes": alertes},
        )

    # 4. Totaux
    total_tva = (total_ht * Decimal(str(TAUX_TVA))).quantize(Decimal("0.01"))
    total_ttc = total_ht + total_tva

    # 5. Créer la facture — client + lignes + décréments dans le même commit
    facture = Facture(
        numero=generer_numero(db),
        client_id=client.id,
        total_ht=total_ht,
        total_tva=total_tva,
        total_ttc=total_ttc,
        lignes=lignes,
    )
    db.add(facture)
    db.commit()
    db.refresh(facture)

    return facture, alertes
def ajouter_lignes(db: Session, facture_id: int, nouvelles_lignes) -> tuple:
    facture = db.query(Facture).filter(Facture.id == facture_id).first()
    if not facture:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    if facture.statut != "brouillon":
        raise HTTPException(
            status_code=409,
            detail="Facture validée : rouvrir d'abord pour la modifier",
        )

    alertes = []
    total_ajout = Decimal("0.00")

    for ligne in nouvelles_lignes:
        # Décrément atomique, même principe qu'à la création
        resultat = (
            db.query(Article)
            .filter(
                Article.id == ligne.article_id,
                Article.quantite_stock >= ligne.quantite,
                )
            .update(
                {Article.quantite_stock: Article.quantite_stock - ligne.quantite},
                synchronize_session=False,
            )
        )

        if resultat == 0:
            article = db.query(Article).filter(Article.id == ligne.article_id).first()
            if not article:
                alertes.append(f"Article id={ligne.article_id} introuvable — non ajouté")
            else:
                alertes.append(
                    f"'{article.designation}' indisponible "
                    f"(demandé : {ligne.quantite}, en stock : {article.quantite_stock}) — non ajouté"
                )
            continue

        article = db.query(Article).filter(Article.id == ligne.article_id).first()
        montant = article.prix_unitaire_ht * ligne.quantite
        total_ajout += montant

        facture.lignes.append(LigneFacture(
            article_id=article.id,
            designation=article.designation,
            prix_unitaire_ht=article.prix_unitaire_ht,
            quantite=ligne.quantite,
            montant_ht=montant,
        ))

    # Recalcul des totaux
    facture.total_ht += total_ajout
    facture.total_tva = (facture.total_ht * Decimal(str(TAUX_TVA))).quantize(Decimal("0.01"))
    facture.total_ttc = facture.total_ht + facture.total_tva

    facture.date_derniere_modification = datetime.utcnow()
    db.commit()
    db.refresh(facture)
    return facture, alertes


def valider_facture(db: Session, facture_id: int) -> Facture:
    facture = db.query(Facture).filter(Facture.id == facture_id).first()
    if not facture:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    if facture.statut == "validee":
        raise HTTPException(status_code=409, detail="Facture déjà validée")

    facture.statut = "validee"
    db.commit()
    db.refresh(facture)
    return facture
def rouvrir_facture(db: Session, facture_id: int) -> Facture:
    facture = db.query(Facture).filter(Facture.id == facture_id).first()
    if not facture:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    if facture.statut == "brouillon":
        raise HTTPException(status_code=409, detail="Facture déjà en brouillon")

    facture.statut = "brouillon"
    facture.nb_reouvertures += 1
    facture.date_derniere_modification = datetime.utcnow()
    db.commit()
    db.refresh(facture)
    return facture
def retirer_ligne(db: Session, facture_id: int, ligne_id: int) -> Facture:
    facture = db.query(Facture).filter(Facture.id == facture_id).first()
    if not facture:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    if facture.statut != "brouillon":
        raise HTTPException(status_code=409, detail="Facture validée : rouvrir d'abord")

    ligne = next((l for l in facture.lignes if l.id == ligne_id), None)
    if not ligne:
        raise HTTPException(status_code=404, detail="Ligne introuvable sur cette facture")

    # Ré-incrémenter le stock (l'article retourne en rayon)
    db.query(Article).filter(Article.id == ligne.article_id).update(
        {Article.quantite_stock: Article.quantite_stock + ligne.quantite},
        synchronize_session=False,
    )

    # Retirer la ligne et recalculer les totaux
    facture.total_ht -= ligne.montant_ht
    facture.total_tva = (facture.total_ht * Decimal(str(TAUX_TVA))).quantize(Decimal("0.01"))
    facture.total_ttc = facture.total_ht + facture.total_tva
    facture.lignes.remove(ligne)   # delete-orphan s'occupe de la suppression en base

    db.commit()
    db.refresh(facture)
    return facture
