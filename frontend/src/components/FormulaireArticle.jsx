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
        <div style={{
            border: '1px solid #ddd',
            borderRadius: 6,
            padding: '1rem',
            marginBottom: '1.5rem',
            background: '#fafafa',
        }}>
            <h3 style={{ marginTop: 0 }}>
                {article ? `Modifier « ${article.designation} »` : 'Nouvel article'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                <input
                    placeholder="Référence"
                    value={valeurs.reference}
                    onChange={changer('reference')}
                />
                <input
                    placeholder="Désignation"
                    value={valeurs.designation}
                    onChange={changer('designation')}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <input
                    type="number" step="0.01" min="0.01"
                    placeholder="Prix HT"
                    value={valeurs.prix_unitaire_ht}
                    onChange={changer('prix_unitaire_ht')}
                />
                <input
                    type="number" min="0"
                    placeholder="Stock"
                    value={valeurs.quantite_stock}
                    onChange={changer('quantite_stock')}
                />
                <input
                    type="number" min="0"
                    placeholder="Seuil d'alerte"
                    value={valeurs.seuil_alerte}
                    onChange={changer('seuil_alerte')}
                />
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button onClick={soumettre} disabled={!valide || enCours}>
                    {enCours ? 'Enregistrement…' : article ? 'Modifier' : 'Créer'}
                </button>
                <button onClick={onAnnuler} disabled={enCours}>Annuler</button>
            </div>
        </div>
    )
}