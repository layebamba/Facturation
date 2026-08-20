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
        <div style={{ maxWidth: 900, margin: '2rem auto', fontFamily: 'system-ui' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0 }}>Clients</h1>
                {!formulaireOuvert && (
                    <button onClick={ouvrirCreation}>+ Nouveau client</button>
                )}
            </div>

            {erreur && <p style={{ color: 'crimson', marginTop: '1rem' }}>{erreur}</p>}

            {formulaireOuvert && (
                <div style={{ marginTop: '1rem' }}>
                    <FormulaireClient
                        client={clientEnEdition}
                        onValider={valider}
                        onAnnuler={fermer}
                    />
                </div>
            )}

            {clients.length === 0 && !erreur && <p>Aucun client pour l'instant.</p>}

            {clients.length > 0 && (
                <table width="100%" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                    <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                        <th>Nom</th>
                        <th>Prénom</th>
                        <th>Téléphone</th>
                        <th>Email</th>
                        <th>État</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {clients.map((c) => (
                        <tr
                            key={c.id}
                            style={{
                                borderBottom: '1px solid #eee',
                                background: c.actif ? 'transparent' : '#f5f5f5',
                                color: c.actif ? 'inherit' : '#999',
                            }}
                        >
                            <td>{c.nom}</td>
                            <td>{c.prenom || '—'}</td>
                            <td>{c.telephone}</td>
                            <td>{c.email || '—'}</td>
                            <td>{c.actif ? 'Actif' : 'Inactif'}</td>
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <button onClick={() => ouvrirEdition(c)}>Modifier</button>{' '}
                                <button onClick={() => basculer(c)}>
                                    {c.actif ? 'Désactiver' : 'Réactiver'}
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}