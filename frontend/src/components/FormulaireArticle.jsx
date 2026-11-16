import { useState, useEffect } from 'react'

const vide = {
    reference: '',
    designation: '',
    prix_unitaire_ht: '',
    quantite_stock: 0,
    seuil_alerte: 5,
}

export default function FormulaireArticle({ article, onValider, onAnnuler }) {
    const [valeurs, setValeurs] = useState(vide)
    const [enCours, setEnCours] = useState(false)

    useEffect(() => {
        setValeurs(article ? { ...article } : vide)
    }, [article])

    const changer = (champ) => (e) =>
        setValeurs((v) => ({ ...v, [champ]: e.target.value }))

    async function soumettre() {
        setEnCours(true)
        try {
            await onValider({
                reference: valeurs.reference.trim(),
                designation: valeurs.designation.trim(),
                prix_unitaire_ht: Number(valeurs.prix_unitaire_ht),
                quantite_stock: Number(valeurs.quantite_stock),
                seuil_alerte: Number(valeurs.seuil_alerte),
            })
        } finally {
            setEnCours(false)
        }
    }

    const valide =
        valeurs.reference.trim() &&
        valeurs.designation.trim() &&
        Number(valeurs.prix_unitaire_ht) > 0

    return (
        <div className="panneau">
            <h3>{article ? `Modifier « ${article.designation} »` : 'Nouvel article'}</h3>

            <div className="champs">
                <label className="champ">
                    Référence *
                    <input value={valeurs.reference} onChange={changer('reference')} />
                </label>
                <label className="champ large">
                    Désignation *
                    <input value={valeurs.designation} onChange={changer('designation')} />
                </label>
            </div>

            <div className="champs">
                <label className="champ">
                    Prix HT (F) *
                    <input
                        type="number" step="0.01" min="0.01"
                        value={valeurs.prix_unitaire_ht}
                        onChange={changer('prix_unitaire_ht')}
                    />
                </label>
                <label className="champ">
                    Stock
                    <input
                        type="number" min="0"
                        value={valeurs.quantite_stock}
                        onChange={changer('quantite_stock')}
                    />
                </label>
                <label className="champ">
                    Seuil d'alerte
                    <input
                        type="number" min="0"
                        value={valeurs.seuil_alerte}
                        onChange={changer('seuil_alerte')}
                    />
                </label>
            </div>

            <div className="boutons">
                <button className="principal" onClick={soumettre} disabled={!valide || enCours}>
                    {enCours ? 'Enregistrement…' : article ? 'Enregistrer les modifications' : 'Créer l\'article'}
                </button>
                <button onClick={onAnnuler} disabled={enCours}>Annuler</button>
            </div>
        </div>
    )
}