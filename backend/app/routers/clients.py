from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm.session import Session

from app.database import get_db
from app.models import Client
from app.schemas.client import ClientLecture, ClientCreation

router = APIRouter(prefix="/clients", tags=["Clients"])
@router.get("", response_model=list[ClientLecture])
def lister_clients(db: Session = Depends(get_db)):
    return db.query(Client).all()
@router.get("/{client_id}", response_model=ClientLecture)
def obtenir_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")
    return client
@router.put("/{client_id}", response_model=ClientLecture)
def modifier_client(
        client_id: int,
        donnees: ClientCreation,
        db: Session = Depends(get_db),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")

    # Vérifier que le numéro n'appartient pas à un autre client
    doublon = (
        db.query(Client)
        .filter(Client.telephone == donnees.telephone, Client.id != client_id)
        .first()
    )
    if doublon:
        raise HTTPException(status_code=409, detail="Télephone déjà utilisé")

    for champ, valeur in donnees.model_dump().items():
        setattr(client, champ, valeur)

    db.commit()
    db.refresh(client)
    return client

@router.delete("/{client_id}", status_code=204)
def supprimer_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")

    db.delete(client)
    db.commit()

@router.post("", response_model=ClientLecture, status_code=201)
def creer_client(donnees: ClientCreation, db: Session = Depends(get_db)):
    existe = db.query(Client).filter(Client.telephone == donnees.telephone).first()
    if existe:
        raise HTTPException(status_code=409, detail="Téléphone déjà existant")

    client = Client(**donnees.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client