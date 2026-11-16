import { useEffect, useState } from 'react'
import { listerFactures, telechargerPdfFacture, imprimerPdfFacture } from '../api'
import FormulaireFacture from '../components/FormulaireFacture'
import DetailFacture from '../components/DetailFacture'

const LIBELLES_PAIEMENT = {
    impayee: 'Impayée',
    partielle: 'Partielle',
    payee: 'Payée',
}

function formaterDate(valeur) {
    if (!valeur) return '—'
    return new Date(valeur).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

function formaterMontant(valeur) {
    return `${Number(valeur).toLocaleString('fr-FR')} F`
}

function nomClient(client) {
    return client.prenom ? `${client.prenom} ${client.nom}` : client.nom
}

export default function Factures() {
    const [factures, setFactures] = useState([])
    const [erreur, setErreur] = useState(null)
    const [formulaireOuvert, setFormulaireOuvert] = useState(false)
    const [alertes, setAlertes] = useState([])
    const [detailId, setDetailId] = useState(null)

    const detail = factures.find((f) => f.id === detailId) || null

    async function recharger() {
        try {
            setFactures(await listerFactures())
            setErreur(null)
        } catch (e) {
            setErreur(e.message)
        }
    }

    useEffect(() => {
        let annule = false
        listerFactures()
            .then((data) => { if (!annule) { setFactures(data); setErreur(null) } })
            .catch((e) => { if (!annule) setErreur(e.message) })
        return () => { annule = true }
    }, [])

    async function apresCreation(reponse) {
        setFormulaireOuvert(false)
        setAlertes(reponse.articles_indisponibles || [])
        await recharger()
    }

    function ouvrirCreation() {
        setFormulaireOuvert(true)
        setDetailId(null)
        setErreur(null)
        setAlertes([])
    }

    function ouvrirDetail(f) {
        setDetailId(f.id)
        setFormulaireOuvert(false)
        setErreur(null)
    }

    async function telecharger(f) {
        try {
            await telechargerPdfFacture(f.id, f.numero)
        } catch (e) {
            setErreur(e.message)
        }
    }

    async function imprimer(f) {
        try {
            await imprimerPdfFacture(f.id)
        } catch (e) {
            setErreur(e.message)
        }
    }

    return (
        <div className="page">
            <div className="entete-page">
                <h1>Factures</h1>
                {!formulaireOuvert && (
                    <button className="principal" onClick={ouvrirCreation}>+ Nouvelle facture</button>
                )}
            </div>

            {erreur && <p className="erreur">{erreur}</p>}

            {alertes.length > 0 && (
                <div className="panneau avertissement">
                    <p style={{ margin: 0 }}>Facture créée, avec ces remarques :</p>
                    <ul>
                        {alertes.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                    <button onClick={() => setAlertes([])}>Fermer</button>
                </div>
            )}

            {formulaireOuvert && (
                <div style={{ marginBottom: '1rem' }}>
                    <FormulaireFacture
                        onCree={apresCreation}
                        onAnnuler={() => setFormulaireOuvert(false)}
                    />
                </div>
            )}

            {detail && (
                <div style={{ marginBottom: '1rem' }}>
                    <DetailFacture
                        key={detail.id}
                        facture={detail}
                        onRecharger={recharger}
                        onFermer={() => setDetailId(null)}
                    />
                </div>
            )}

            {factures.length === 0 && !erreur && <p>Aucune facture pour l'instant.</p>}

            {factures.length > 0 && (
                <div className="cadre-tableau">
                    <table className="liste liste-factures">
                        <thead>
                        <tr>
                            <th>Numéro</th>
                            <th>Date</th>
                            <th>Client</th>
                            <th className="droite">Total TTC</th>
                            <th className="droite">Reste à payer</th>
                            <th>État</th>
                            <th>Paiement</th>
                            <th className="droite">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {factures.map((f) => (
                            <tr key={f.id} className={f.id === detailId ? 'selection' : ''}>
                                <td>{f.numero}</td>
                                <td>
                                    {formaterDate(f.date_creation)}
                                    {f.date_derniere_modification && (
                                        <div className="sous-texte">
                                            Modifiée le {formaterDate(f.date_derniere_modification)}
                                        </div>
                                    )}
                                </td>
                                <td>{nomClient(f.client)}</td>
                                <td className="droite">{formaterMontant(f.total_ttc)}</td>
                                <td className={`droite reste ${f.statut_paiement}`}>
                                    {formaterMontant(f.reste_a_payer)}
                                </td>
                                <td>
                                    <span className={`pastille ${f.statut === 'brouillon' ? 'brouillon' : 'validee'}`}>
                                        {f.statut === 'brouillon' ? 'Brouillon' : 'Validée'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`pastille ${f.statut_paiement}`}>
                                        {LIBELLES_PAIEMENT[f.statut_paiement] ?? f.statut_paiement}
                                    </span>
                                </td>
                                <td className="actions">
                                    <button onClick={() => ouvrirDetail(f)}>Détails</button>{' '}
                                    <button className="discret" onClick={() => telecharger(f)}>Télécharger</button>
                                    <button className="discret" onClick={() => imprimer(f)}>Imprimer</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}