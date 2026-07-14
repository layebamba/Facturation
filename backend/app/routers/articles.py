from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.article import Article
from app.schemas.article import ArticleCreation, ArticleLecture

router = APIRouter(prefix="/articles", tags=["Articles"])


@router.get("", response_model=list[ArticleLecture])
def lister_articles(db: Session = Depends(get_db)):
    return db.query(Article).all()

@router.get("/recherche", response_model=list[ArticleLecture])
def rechercher_articles(q: str, db: Session = Depends(get_db)):
    """Autocomplétion : cherche dans la désignation ET la référence."""
    terme = f"%{q}%"
    return (
        db.query(Article)
        .filter(
            (Article.designation.ilike(terme)) | (Article.reference.ilike(terme))
        )
        .order_by(Article.designation)
        .limit(10)
        .all()
    )

@router.get("/{article_id}", response_model=ArticleLecture)
def obtenir_article(article_id: int, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article introuvable")
    return article


@router.put("/{article_id}", response_model=ArticleLecture)
def modifier_article(
        article_id: int,
        donnees: ArticleCreation,
        db: Session = Depends(get_db),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article introuvable")

    # Vérifier que la nouvelle référence n'appartient pas à un autre article
    doublon = (
        db.query(Article)
        .filter(Article.reference == donnees.reference, Article.id != article_id)
        .first()
    )
    if doublon:
        raise HTTPException(status_code=409, detail="Référence déjà utilisée")

    for champ, valeur in donnees.model_dump().items():
        setattr(article, champ, valeur)

    db.commit()
    db.refresh(article)
    return article


@router.delete("/{article_id}", status_code=204)
def supprimer_article(article_id: int, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article introuvable")
 
    db.delete(article)
    db.commit()


@router.post("", response_model=ArticleLecture, status_code=201)
def creer_article(donnees: ArticleCreation, db: Session = Depends(get_db)):
    existe = db.query(Article).filter(Article.reference == donnees.reference).first()
    if existe:
        raise HTTPException(status_code=409, detail="Référence déjà existante")

    article = Article(**donnees.model_dump())
    db.add(article)
    db.commit()
    db.refresh(article)
    return article
