from sqlalchemy import text
from app.database import engine

with engine.begin() as conn:
    conn.execute(text("ALTER TABLE articles ADD COLUMN IF NOT EXISTS actif BOOLEAN NOT NULL DEFAULT true;"))
    conn.execute(text("ALTER TABLE clients  ADD COLUMN IF NOT EXISTS actif BOOLEAN NOT NULL DEFAULT true;"))
    print("Colonnes actif ajoutées.")