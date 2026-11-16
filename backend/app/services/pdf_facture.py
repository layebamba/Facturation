from decimal import Decimal
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

# À adapter : informations de la boutique affichées en en-tête
BOUTIQUE = {
    "nom": "NOM DE LA BOUTIQUE",
    "adresse": "Adresse, Dakar",
    "telephone": "+221 00 000 00 00",
    "ninea": "",  # laisser vide pour ne pas l'afficher
}

MODES = {
    "especes": "Espèces",
    "wave": "Wave",
    "orange_money": "Orange Money",
    "virement": "Virement",
}

STATUTS_PAIEMENT = {
    "impayee": "IMPAYÉE",
    "partielle": "PAIEMENT PARTIEL",
    "payee": "PAYÉE",
}

GRIS = colors.HexColor("#444444")
GRIS_CLAIR = colors.HexColor("#EEEEEE")


def fcfa(valeur) -> str:
    """Formate un montant en FCFA, sans décimales : 12 500 FCFA."""
    entier = Decimal(valeur).quantize(Decimal("1"))
    return f"{entier:,}".replace(",", " ") + " FCFA"


def generer_pdf_facture(facture) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title=f"Facture {facture.numero}",
    )

    base = getSampleStyleSheet()["Normal"]
    normal = ParagraphStyle("n", parent=base, fontSize=9.5, leading=13)
    titre = ParagraphStyle("t", parent=normal, fontSize=18, leading=22, fontName="Helvetica-Bold")
    droite = ParagraphStyle("d", parent=normal, alignment=2)

    elements = []

    # ---- En-tête : boutique à gauche, infos facture à droite ----
    boutique = [Paragraph(f"<b>{BOUTIQUE['nom']}</b>", ParagraphStyle("b", parent=normal, fontSize=13, leading=16))]
    boutique.append(Paragraph(BOUTIQUE["adresse"], normal))
    boutique.append(Paragraph(f"Tél : {BOUTIQUE['telephone']}", normal))
    if BOUTIQUE["ninea"]:
        boutique.append(Paragraph(f"NINEA : {BOUTIQUE['ninea']}", normal))

    infos = [
        Paragraph("FACTURE", ParagraphStyle("f", parent=titre, alignment=2)),
        Paragraph(f"N° {facture.numero}", droite),
        Paragraph(f"Date : {facture.date_creation.strftime('%d/%m/%Y à %H:%M')}", droite),
    ]
    if facture.statut == "brouillon":
        infos.append(Paragraph("<b>BROUILLON</b>", droite))
    elif facture.nb_reouvertures > 0:
        infos.append(Paragraph(f"Facture corrigée (révision {facture.nb_reouvertures})", droite))
    if facture.date_derniere_modification:
        infos.append(Paragraph(
            f"Modifiée le {facture.date_derniere_modification.strftime('%d/%m/%Y à %H:%M')}",
            droite,
        ))
    entete = Table([[boutique, infos]], colWidths=[90 * mm, 84 * mm])
    entete.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements += [entete, Spacer(1, 8 * mm)]

    # ---- Bloc client ----
    c = facture.client
    nom_client = f"{c.prenom} {c.nom}" if c.prenom else c.nom
    bloc_client = [Paragraph("<b>Facturé à</b>", normal), Paragraph(nom_client, normal),
                   Paragraph(f"Tél : {c.telephone}", normal)]
    if c.adresse:
        bloc_client.append(Paragraph(c.adresse, normal))
    elements += [*bloc_client, Spacer(1, 8 * mm)]

    # ---- Lignes ----
    donnees = [["Désignation", "Qté", "Prix unit. HT", "Montant HT"]]
    for l in facture.lignes:
        donnees.append([
            Paragraph(l.designation, normal),
            str(l.quantite),
            fcfa(l.prix_unitaire_ht),
            fcfa(l.montant_ht),
        ])
    table = Table(donnees, colWidths=[78 * mm, 18 * mm, 38 * mm, 40 * mm], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GRIS),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, GRIS_CLAIR]),
        ("LINEBELOW", (0, -1), (-1, -1), 0.5, GRIS),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    elements += [table, Spacer(1, 6 * mm)]
    # ---- Totaux ----
    modes_utilises = []
    for p in sorted(facture.paiements, key=lambda p: p.date_paiement):
        libelle = MODES.get(p.mode, p.mode)
        if libelle not in modes_utilises:
            modes_utilises.append(libelle)
    mode_paiement = ", ".join(modes_utilises) if modes_utilises else "—"

    # ---- Totaux ----
    lignes_totaux = [
        ["Total HT", fcfa(facture.total_ht)],
        ["TVA (18 %)", fcfa(facture.total_tva)],
        ["Total TTC", fcfa(facture.total_ttc)],
    ]
    # Une ligne par paiement : le mode à gauche, le montant à droite
    for p in sorted(facture.paiements, key=lambda p: p.date_paiement):
        lignes_totaux.append([MODES.get(p.mode, p.mode), fcfa(p.montant)])
    lignes_totaux.append(["Déjà payé", fcfa(facture.montant_paye)])
    lignes_totaux.append(["Reste à payer", fcfa(facture.reste_a_payer)])
    dernier = len(lignes_totaux) - 1

    totaux = Table(lignes_totaux, colWidths=[45 * mm, 45 * mm], hAlign="RIGHT")
    totaux.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold"),
        ("FONTNAME", (0, dernier), (-1, dernier), "Helvetica-Bold"),
        ("LINEABOVE", (0, 2), (-1, 2), 0.5, GRIS),
        ("LINEABOVE", (0, dernier), (-1, dernier), 0.5, GRIS),
    ]))
    elements += [totaux, Spacer(1, 4 * mm)]
    elements.append(Paragraph(f"Statut : <b>{STATUTS_PAIEMENT[facture.statut_paiement]}</b>", droite))

    elements += [Spacer(1, 12 * mm), Paragraph("Merci de votre confiance.", normal)]

    doc.build(elements)
    return buffer.getvalue()