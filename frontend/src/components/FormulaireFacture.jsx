import { useEffect, useState } from 'react'
import {
    creerFacture,
    listerClients,
    rechercherArticles,
    validerFacture,
    encaisserPaiement,
} from '../api'

const TAUX_TVA = 0.18
const MODES = [
    { valeur: 'especes', libelle: 'Espèces' },
    { valeur: 'wave', libelle: 'Wave' },
    { valeur: 'orange_money', libelle: 'Orange Money' },
    { valeur: 'virement', libelle: 'Virement' },
]

function fcfa(valeur) {
    return `${Math.round(valeur).toLocaleString('fr-FR')} F`
}

export default function FormulaireFacture({ onCree, onAnnuler }) {
    const [clients, setClients] = useState([])
    const [client, setClient] = useState({ telephone: '', nom: '', prenom: '', adresse: '' })
    const [recherche, setRecherche] = useState('')
    const [resultats, setResultats] = useState([])
    const [lignes, setLignes] = useState([])
    const [erreur, setErreur] = useState(null)
    const [enCours, setEnCours] = useState(false)
    const [articleChoisi, setArticleChoisi] = useState(null)
    const [quantiteSaisie, setQuantiteSaisie] = useState('1')
    const [paiements, setPaiements] = useState([{ mode: 'especes', montant: '' }])

    // Clients existants, pour pré-remplir à partir du téléphone
    useEffect(() => {
        let annule = false
        listerClients()
            .then((data) => { if (!annule) setClients(data) })
            .catch(() => {})
        return () => { annule = true }
    }, [])

    // Recherche d'articles avec un léger délai
    useEffect(() => {
        if (recherche.trim().length < 2) return
        let annule = false
        const minuteur = setTimeout(() => {
            rechercherArticles(recherche.trim())
                .then((data) => {
                    if (!annule) setResultats(data.filter((a) => a.actif !== false))
                })
                .catch((e) => { if (!annule) setErreur(e.message) })
        }, 300)
        return () => { annule = true; clearTimeout(minuteur) }
    }, [recherche])

    function majClient(nom, valeur) {
        setClient((c) => ({ ...c, [nom]: valeur }))
    }

    function completerClient() {
        const existant = clients.find((c) => c.telephone === client.telephone.trim())
        if (!existant) return
        setClient((c) => ({
            ...c,
            nom: c.nom || existant.nom || '',
            prenom: c.prenom || existant.prenom || '',
            adresse: c.adresse || existant.adresse || '',
        }))
    }

    function choisirArticle(article) {
        setArticleChoisi(article)
        setQuantiteSaisie('1')
        setRecherche('')
        setResultats([])
    }

    function ajouterLigne() {
        const article = articleChoisi
        if (!article) return
        const quantite = Math.max(1, parseInt(quantiteSaisie, 10) || 1)
        setLignes((ls) => {
            const deja = ls.find((l) => l.article.id === article.id)
            if (deja) {
                return ls.map((l) =>
                    l.article.id === article.id ? { ...l, quantite: l.quantite + quantite } : l
                )
            }
            return [...ls, { article, quantite }]
        })
        setArticleChoisi(null)
        setQuantiteSaisie('1')
    }

    function changerQuantite(id, valeur) {
        const quantite = Math.max(1, parseInt(valeur, 10) || 1)
        setLignes((ls) => ls.map((l) => (l.article.id === id ? { ...l, quantite } : l)))
    }

    function retirer(id) {
        setLignes((ls) => ls.filter((l) => l.article.id !== id))
    }

    const totalHt = lignes.reduce((s, l) => s + Number(l.article.prix_unitaire_ht) * l.quantite, 0)
    const totalTva = Math.round(totalHt * TAUX_TVA * 100) / 100
    const totalTtc = totalHt + totalTva
    const montantSaisi = paiements.reduce((s, p) => s + (Number(p.montant) || 0), 0)
    const resteAPayer = Math.max(0, totalTtc - montantSaisi)
    const depasse = Math.round(montantSaisi * 100) > Math.round(totalTtc * 100)

    function majPaiement(index, nom, valeur) {
        setPaiements((ps) => ps.map((p, i) => (i === index ? { ...p, [nom]: valeur } : p)))
    }

    function ajouterPaiement() {
        setPaiements((ps) => {
            const utilises = ps.map((p) => p.mode)
            const prochain = MODES.find((m) => !utilises.includes(m.valeur))
            if (!prochain) return ps
            const reste = Math.round(resteAPayer * 100) / 100
            return [...ps, { mode: prochain.valeur, montant: reste > 0 ? String(reste) : '' }]
        })
    }

    function retirerPaiement(index) {
        setPaiements((ps) => ps.filter((_, i) => i !== index))
    }

    function completerAvecReste(index) {
        setPaiements((ps) => ps.map((p, i) => {
            if (i !== index) return p
            const total = (Number(p.montant) || 0) + resteAPayer
            return { ...p, montant: String(Math.round(total * 100) / 100) }
        }))
    }

    async function soumettre(e) {
        e.preventDefault()
        setErreur(null)
        if (!client.nom.trim() || client.telephone.trim().length < 7) {
            setErreur('Nom et téléphone du client obligatoires (7 caractères minimum pour le téléphone).')
            return
        }
        if (lignes.length === 0) {
            setErreur('Ajoutez au moins un article.')
            return
        }
        const paiementsValides = paiements
            .map((p) => ({ mode: p.mode, montant: Number(p.montant) || 0 }))
            .filter((p) => p.montant > 0)
        const totalPaye = paiementsValides.reduce((s, p) => s + p.montant, 0)
        if (Math.round(totalPaye * 100) > Math.round(totalTtc * 100)) {
            setErreur('Le total des paiements dépasse le total TTC.')
            return
        }
        setEnCours(true)
        try {
            const reponse = await creerFacture({
                client: {
                    nom: client.nom.trim(),
                    prenom: client.prenom.trim() || null,
                    telephone: client.telephone.trim(),
                    adresse: client.adresse.trim() || null,
                },
                lignes: lignes.map((l) => ({ article_id: l.article.id, quantite: l.quantite })),
            })
            if (paiementsValides.length > 0) {
                const id = reponse.facture.id
                try {
                    await validerFacture(id, null)
                    for (const p of paiementsValides) {
                        await encaisserPaiement(id, p)
                    }
                } catch (err) {
                    // la facture existe déjà : on signale ce qui n'a pas pu être enregistré
                    reponse.articles_indisponibles = [
                        ...(reponse.articles_indisponibles || []),
                        `Paiement non enregistré en totalité : ${err.message}`,
                    ]
                }
            }
            onCree(reponse)
        } catch (err) {
            setErreur(err.message)   // le formulaire reste ouvert pour correction
            setEnCours(false)
        }
    }

    return (
        <form className="panneau" onSubmit={soumettre}>
            <h3>Nouvelle facture</h3>

            {erreur && <p className="erreur">{erreur}</p>}

            <h4>Client</h4>
            <div className="champs">
                <label className="champ">
                    Téléphone *
                    <input
                        value={client.telephone}
                        onChange={(e) => majClient('telephone', e.target.value)}
                        onBlur={completerClient}
                    />
                </label>
                <label className="champ">
                    Nom *
                    <input value={client.nom} onChange={(e) => majClient('nom', e.target.value)} />
                </label>
                <label className="champ">
                    Prénom
                    <input value={client.prenom} onChange={(e) => majClient('prenom', e.target.value)} />
                </label>
                <label className="champ">
                    Adresse
                    <input value={client.adresse} onChange={(e) => majClient('adresse', e.target.value)} />
                </label>
            </div>

            <h4>Articles</h4>
            <input
                className="recherche"
                placeholder="Rechercher un article (référence ou désignation)…"
                value={recherche}
                onChange={(e) => {
                    setRecherche(e.target.value)
                    if (e.target.value.trim().length < 2) setResultats([])
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
            />
            {resultats.length > 0 && (
                <ul className="resultats">
                    {resultats.map((a) => (
                        <li key={a.id} onClick={() => choisirArticle(a)}>
                            <span>{a.reference} — {a.designation}</span>
                            <span>{fcfa(a.prix_unitaire_ht)} HT · stock {a.quantite_stock}</span>
                        </li>
                    ))}
                </ul>
            )}

            {articleChoisi && (
                <div className="encart">
                    <div className="titre">
                        <strong>{articleChoisi.designation}</strong>
                        <div className="sous-texte">
                            {articleChoisi.reference} · {fcfa(articleChoisi.prix_unitaire_ht)} HT · stock {articleChoisi.quantite_stock}
                        </div>
                    </div>
                    <label className="champ etroit">
                        Quantité
                        <input
                            type="number"
                            min="1"
                            autoFocus
                            value={quantiteSaisie}
                            onChange={(e) => setQuantiteSaisie(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()   // évite d'envoyer tout le formulaire
                                    ajouterLigne()
                                }
                            }}
                        />
                    </label>
                    <button type="button" className="principal" onClick={ajouterLigne}>Ajouter</button>
                    <button type="button" onClick={() => setArticleChoisi(null)}>Annuler</button>
                </div>
            )}

            {lignes.length > 0 && (
                <table className="liste">
                    <thead>
                    <tr>
                        <th>Désignation</th>
                        <th className="droite">Prix HT</th>
                        <th className="droite">Quantité</th>
                        <th className="droite">Montant HT</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {lignes.map((l) => (
                        <tr key={l.article.id}>
                            <td>
                                {l.article.designation}
                                {l.quantite > l.article.quantite_stock && (
                                    <div className="sous-texte avertissement">
                                        Stock insuffisant ({l.article.quantite_stock}) : la ligne sera retirée à la création.
                                    </div>
                                )}
                            </td>
                            <td className="droite">{fcfa(l.article.prix_unitaire_ht)}</td>
                            <td className="droite">
                                <input
                                    className="qte"
                                    type="number"
                                    min="1"
                                    value={l.quantite}
                                    onChange={(e) => changerQuantite(l.article.id, e.target.value)}
                                />
                            </td>
                            <td className="droite">{fcfa(Number(l.article.prix_unitaire_ht) * l.quantite)}</td>
                            <td className="droite">
                                <button type="button" className="discret" onClick={() => retirer(l.article.id)}>
                                    Retirer
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            <div className="totaux">
                <div>Total HT : {fcfa(totalHt)}</div>
                <div>TVA (18 %) : {fcfa(totalTva)}</div>
                <div className="total-ttc">Total TTC : {fcfa(totalTtc)}</div>
            </div>

            <h4>Paiement (optionnel)</h4>
            {paiements.map((p, i) => (
                <div className="rangee" key={i}>
                    <label className="champ">
                        Mode
                        <select value={p.mode} onChange={(e) => majPaiement(i, 'mode', e.target.value)}>
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
                            value={p.montant}
                            onChange={(e) => majPaiement(i, 'montant', e.target.value)}
                        />
                    </label>
                    <button type="button" onClick={() => completerAvecReste(i)}>Reste</button>
                    {paiements.length > 1 && (
                        <button type="button" className="discret" onClick={() => retirerPaiement(i)}>
                            Retirer
                        </button>
                    )}
                </div>
            ))}
            <button
                type="button"
                onClick={ajouterPaiement}
                disabled={paiements.length >= MODES.length}
            >
                + Ajouter un autre mode
            </button>

            <div className="totaux">
                <div>Montant reçu : {fcfa(montantSaisi)}</div>
                <div className={`reste-final ${resteAPayer > 0 ? 'a-payer' : 'solde'}`}>
                    Reste à payer : {fcfa(resteAPayer)}
                </div>
                {depasse && (
                    <div className="erreur sous-texte">Le total des paiements dépasse le total TTC.</div>
                )}
            </div>
            <p className="aide">
                Si un montant est saisi, la facture est validée avec ces paiements. Sinon elle reste en brouillon.
            </p>

            <div className="boutons">
                <button type="submit" disabled={enCours}>
                    {enCours ? 'Création…' : 'Créer la facture'}
                </button>
                <button type="button" onClick={onAnnuler} disabled={enCours}>Annuler</button>
            </div>
        </form>
    )
}