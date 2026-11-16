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
        <div className="panneau">
            <h3>{client ? `Modifier « ${client.nom} »` : 'Nouveau client'}</h3>

            <div className="champs">
                <label className="champ">
                    Nom *
                    <input value={valeurs.nom} onChange={changer('nom')} />
                </label>
                <label className="champ">
                    Prénom
                    <input value={valeurs.prenom} onChange={changer('prenom')} />
                </label>
                <label className="champ">
                    Téléphone *
                    <input value={valeurs.telephone} onChange={changer('telephone')} />
                </label>
            </div>

            <div className="champs">
                <label className="champ">
                    Email
                    <input type="email" value={valeurs.email} onChange={changer('email')} />
                </label>
                <label className="champ large">
                    Adresse
                    <input value={valeurs.adresse} onChange={changer('adresse')} />
                </label>
            </div>

            <div className="boutons">
                <button className="principal" onClick={soumettre} disabled={!valide || enCours}>
                    {enCours ? 'Enregistrement…' : client ? 'Enregistrer les modifications' : 'Créer le client'}
                </button>
                <button onClick={onAnnuler} disabled={enCours}>Annuler</button>
            </div>
        </div>
    )
}