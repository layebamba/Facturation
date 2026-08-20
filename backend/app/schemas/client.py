from pydantic import BaseModel, Field
from pydantic import EmailStr


class ClientCreation(BaseModel):
    nom: str = Field(min_length=1, max_length=50)
    prenom: str| None = Field(default=None, max_length=100)
    telephone: str = Field(min_length=7, max_length=20)
    email: EmailStr | None = None
    adresse: str| None = Field(default=None, max_length=255)

class ClientLecture(BaseModel):
    id: int
    nom :str
    prenom: str| None = None
    telephone :str
    email :str | None = None
    adresse: str | None = None
    actif: bool

    class Config:
        from_attributes = True