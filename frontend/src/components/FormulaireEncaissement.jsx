import { useState } from 'react'
import { encaisserPaiement, validerFacture } from '../api'

const MODES = [
    { valeur: 'especes', libelle: 'Espèces' },
    { valeur: 'wave', libelle: 'Wave' },
    { valeur: 'orange_money', libelle: 'Orange Money' },
    { valeur: 'virement', libelle: 'Virement' },
]

function fcfa(valeur) {
    return `${Math.round(Number(valeur)).toLocaleString('fr-FR')} F`
}

export default function FormulaireEncaissement({ facture, onEncaisse, onAnnuler }) {
    const reste = Number(facture.reste_a_payer)
    const [mode, setMode] = useState('especes')
    const [montant, setMontant] = useState(String(reste))
    const [erreur, setErreur] = useState(null)
    const [enCours, setEnCours] = useState(false)
    const [dejaValide, setDejaValide] = useState(false)

    const montantSaisi = Number(montant) || 0
    const resteApres = Math.max(0, reste - montantSaisi)

    async function soumettre(e) {
        e.preventDefault()
        setErreur(null)
        if (montantSaisi <= 0) {
            setErreur('Saisissez un montant supérieur à 0.')
            return
        }
        if (Math.round(montantSaisi * 100) > Math.round(reste * 100)) {
            setErreur(`Le montant dépasse le reste à payer (${fcfa(reste)}).`)
            return
        }
        setEnCours(true)
        try {
            if (facture.statut === 'brouillon' && !dejaValide) {
                await validerFacture(facture.id, null)
                setDejaValide(true)
            }
            await encaisserPaiement(facture.id, {
                montant: Math.round(montantSaisi * 100) / 100,
                mode,
            })
            onEncaisse()
        } catch (err) {
            setErreur(err.message)
            setEnCours(false)
        }
    }

    return (
        <form className="panneau" onSubmit={soumettre}>
            <h3>
                {facture.statut === 'brouillon' ? 'Valider et encaisser' : 'Encaisser'} — {facture.numero}
            </h3>
            <p className="infos">
                Total TTC : {fcfa(facture.total_ttc)} · Déjà payé : {fcfa(facture.montant_paye)} ·{' '}
                <strong>Reste à payer : {fcfa(reste)}</strong>
            </p>

            {erreur && <p className="erreur">{erreur}</p>}

            <div className="rangee">
                <label className="champ">
                    Mode
                    <select value={mode} onChange={(e) => setMode(e.target.value)}>
                        {MODES.map((m) => (
                            <option key={m.valeur} value={m.valeur}>{m.libelle}</option>
                        ))}
                    </select>
                </label>
                <label className="champ">
                    Montant (F)
                    <input
                        type="number"
                        min="0"
                        autoFocus
                        value={montant}
                        onChange={(e) => setMontant(e.target.value)}
                    />
                </label>
                <button type="button" onClick={() => setMontant(String(reste))}>Reste</button>
            </div>

            <div className="totaux">
                <div className={`reste-final ${resteApres > 0 ? 'a-payer' : 'solde'}`}>
                    Reste après ce paiement : {fcfa(resteApres)}
                </div>
            </div>

            <div className="boutons">
                <button type="submit" disabled={enCours}>
                    {enCours ? 'Enregistrement…' : 'Enregistrer le paiement'}
                </button>
                <button type="button" onClick={onAnnuler} disabled={enCours}>Annuler</button>
            </div>
        </form>
    )
}