import { useState, useEffect } from 'react'

const vide = {
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresse: '',
}

export default function FormulaireClient({ client, onValider, onAnnuler }) {
    const [valeurs, setValeurs] = useState(vide)
    const [enCours, setEnCours] = useState(false)

    useEffect(() => {
        if (!client) return setValeurs(vide)
        setValeurs({
            nom: client.nom ?? '',
            prenom: client.prenom ?? '',
            telephone: client.telephone ?? '',
            email: client.email ?? '',
            adresse: client.adresse ?? '',
        })
    }, [client])

    const changer = (champ) => (e) =>
        setValeurs((v) => ({ ...v, [champ]: e.target.value }))

    /** Les champs optionnels vides doivent partir en null, pas en chaîne vide. */
    const ouNull = (s) => {
        const t = s.trim()
        return t === '' ? null : t
    }

    async function soumettre() {
        setEnCours(true)
        try {
            await onValider({
                nom: valeurs.nom.trim(),
                prenom: ouNull(valeurs.prenom),
                telephone: valeurs.telephone.trim(),
                email: ouNull(valeurs.email),
                adresse: ouNull(valeurs.adresse),
            })
        } finally {
            setEnCours(false)
        }
    }

    const valide = valeurs.nom.trim() && valeurs.telephone.trim().length >= 7

    return (
        <div style={{
            border: '1px solid #ddd',
            borderRadius: 6,
            padding: '1rem',
            marginBottom: '1.5rem',
            background: '#fafafa',
        }}>
            <h3 style={{ marginTop: 0 }}>
                {client ? `Modifier « ${client.nom} »` : 'Nouveau client'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <input placeholder="Nom *" value={valeurs.nom} onChange={changer('nom')} />
                <input placeholder="Prénom" value={valeurs.prenom} onChange={changer('prenom')} />
                <input placeholder="Téléphone *" value={valeurs.telephone} onChange={changer('telephone')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <input type="email" placeholder="Email" value={valeurs.email} onChange={changer('email')} />
                <input placeholder="Adresse" value={valeurs.adresse} onChange={changer('adresse')} />
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button onClick={soumettre} disabled={!valide || enCours}>
                    {enCours ? 'Enregistrement…' : client ? 'Modifier' : 'Créer'}
                </button>
                <button onClick={onAnnuler} disabled={enCours}>Annuler</button>
            </div>
        </div>
    )
}