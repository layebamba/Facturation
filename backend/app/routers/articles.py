from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.article import Article
from app.schemas.article import ArticleCreation, ArticleLecture

router = APIRouter(prefix="/articles", tags=["Articles"])


@router.get("", response_model=list[ArticleLecture])
def lister_articles(db: Session = Depends(get_db)):
    return db.query(Article).all()


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