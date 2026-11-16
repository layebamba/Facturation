import { useEffect, useState } from 'react'
import {
    listerClients,
    creerClient,
    modifierClient,
    basculerActivationClient,
} from '../api'
import FormulaireClient from '../components/FormulaireClient'

export default function Clients() {
    const [clients, setClients] = useState([])
    const [erreur, setErreur] = useState(null)
    const [formulaireOuvert, setFormulaireOuvert] = useState(false)
    const [clientEnEdition, setClientEnEdition] = useState(null)

    async function recharger() {
        try {
            setClients(await listerClients())
            setErreur(null)
        } catch (e) {
            setErreur(e.message)
        }
    }

    useEffect(() => { recharger() }, [])

    function ouvrirCreation() {
        setClientEnEdition(null)
        setFormulaireOuvert(true)
        setErreur(null)
    }

    function ouvrirEdition(client) {
        setClientEnEdition(client)
        setFormulaireOuvert(true)
        setErreur(null)
    }

    function fermer() {
        setFormulaireOuvert(false)
        setClientEnEdition(null)
    }

    async function valider(donnees) {
        try {
            if (clientEnEdition) {
                await modifierClient(clientEnEdition.id, donnees)
            } else {
                await creerClient(donnees)
            }
            fermer()
            await recharger()
        } catch (e) {
            setErreur(e.message)
        }
    }

    async function basculer(client) {
        const action = client.actif ? 'Désactiver' : 'Réactiver'
        if (!confirm(`${action} « ${client.nom} » ?`)) return
        try {
            await basculerActivationClient(client.id)
            await recharger()
        } catch (e) {
            setErreur(e.message)
        }
    }

    return (
        <div className="page">
            <div className="entete-page">
                <h1>Clients</h1>
                {!formulaireOuvert && (
                    <button className="principal" onClick={ouvrirCreation}>+ Nouveau client</button>
                )}
            </div>

            {erreur && <p className="erreur">{erreur}</p>}

            {formulaireOuvert && (
                <div style={{ marginBottom: '1rem' }}>
                    <FormulaireClient
                        client={clientEnEdition}
                        onValider={valider}
                        onAnnuler={fermer}
                    />
                </div>
            )}

            {clients.length === 0 && !erreur && <p>Aucun client pour l'instant.</p>}

            {clients.length > 0 && (
                <div className="cadre-tableau">
                    <table className="liste">
                        <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Prénom</th>
                            <th>Téléphone</th>
                            <th>Email</th>
                            <th>État</th>
                            <th className="droite">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {clients.map((c) => (
                            <tr key={c.id} className={c.actif ? '' : 'inactif'}>
                                <td>{c.nom}</td>
                                <td>{c.prenom || '—'}</td>
                                <td>{c.telephone}</td>
                                <td>{c.email || '—'}</td>
                                <td>
                                    <span className={`pastille ${c.actif ? 'actif' : 'inactif'}`}>
                                        {c.actif ? 'Actif' : 'Inactif'}
                                    </span>
                                </td>
                                <td className="actions">
                                    <button onClick={() => ouvrirEdition(c)}>Modifier</button>{' '}
                                    <button className="discret" onClick={() => basculer(c)}>
                                        {c.actif ? 'Désactiver' : 'Réactiver'}
                                    </button>
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