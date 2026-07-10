"""Seed : insère des articles de démonstration. Relançable sans doublons."""
from app.database import SessionLocal
from app.models.article import Article

ARTICLES = [
    # (reference, designation, prix_ht, stock, seuil)
    ("SAV-001", "Savon artisanal karité", 500, 24, 5),
    ("SAV-002", "Savon noir 200g", 350, 3, 5),        # stock bas
    ("RIZ-001", "Riz brisé parfumé 5kg", 3500, 40, 10),
    ("RIZ-002", "Riz brisé parfumé 25kg", 16500, 8, 10),  # stock bas
    ("HUI-001", "Huile végétale 1L", 1200, 30, 8),
    ("HUI-002", "Huile végétale 5L", 5500, 12, 6),
    ("SUC-001", "Sucre en poudre 1kg", 650, 50, 15),
    ("SUC-002", "Sucre en morceaux 1kg", 750, 18, 10),
    ("THE-001", "Thé vert de Chine 250g", 1000, 25, 8),
    ("CAF-001", "Café Touba moulu 250g", 800, 15, 5),
    ("LAI-001", "Lait en poudre 400g", 2200, 22, 8),
    ("LAI-002", "Lait en poudre 900g", 4500, 6, 8),    # stock bas
    ("TOM-001", "Concentré de tomate 400g", 450, 60, 20),
    ("TOM-002", "Concentré de tomate 800g", 850, 35, 15),
    ("PAT-001", "Pâtes alimentaires 500g", 400, 80, 25),
    ("PAT-002", "Vermicelles 500g", 350, 45, 15),
    ("OIG-001", "Oignon local (kg)", 600, 100, 30),
    ("POM-001", "Pomme de terre (kg)", 500, 90, 30),
    ("BIS-001", "Biscuits secs paquet", 250, 120, 40),
    ("BOI-001", "Bissap concentré 1L", 1500, 10, 6),
    ("BOI-002", "Jus de gingembre 1L", 1500, 4, 6),    # stock bas
    ("EAU-001", "Eau minérale 1.5L", 400, 150, 50),
    ("EAU-002", "Eau minérale pack x6", 2200, 25, 10),
    ("SEL-001", "Sel iodé 500g", 200, 70, 20),
    ("MAY-001", "Mayonnaise 470ml", 1300, 14, 8),
    ("MOU-001", "Moutarde 210g", 700, 20, 8),
    ("VIN-001", "Vinaigre blanc 1L", 500, 28, 10),
    ("BOU-001", "Bouillon cube boîte x60", 1800, 33, 12),
    ("SAR-001", "Sardines à l'huile 125g", 750, 55, 20),
    ("SPR-001", "Spray insecticide 400ml", 2500, 9, 5),
    ("ALL-001", "Allumettes lot x10", 500, 40, 15),
    ("BOG-001", "Bougie standard", 300, 2, 10),        # stock bas
    ("PIL-001", "Piles AA lot x4", 1500, 16, 6),
    ("SAC-001", "Sacs poubelle rouleau x20", 1000, 26, 10),
    ("JAV-001", "Eau de javel 1L", 600, 30, 12),
]


def seed():
    db = SessionLocal()
    crees, ignores = 0, 0
    try:
        for ref, designation, prix, stock, seuil in ARTICLES:
            existe = db.query(Article).filter(Article.reference == ref).first()
            if existe:
                ignores += 1
                continue
            db.add(Article(
                reference=ref,
                designation=designation,
                prix_unitaire_ht=prix,
                quantite_stock=stock,
                seuil_alerte=seuil,
            ))
            crees += 1
        db.commit()
        print(f"Seed termine : {crees} crees, {ignores} deja presents.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()