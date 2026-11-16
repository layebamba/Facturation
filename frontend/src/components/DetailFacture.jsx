import { useEffect, useState } from 'react'
import {
    rechercherArticles,
    ajouterLignesFacture,
    supprimerLigneFacture,
    validerFacture,
    rouvrirFacture,
} from '../api'
import FormulaireEncaissement from './FormulaireEncaissement'

const MODES = { especes: 'Espèces', wave: 'Wave', orange_money: 'Orange Money', virement: 'Virement' }
const LIBELLES_PAIEMENT = { impayee: 'Impayée', partielle: 'Partielle', payee: 'Payée' }

function fcfa(valeur) {
    return `${Math.round(Number(valeur)).toLocaleString('fr-FR')} F`
}

function formaterDate(valeur) {
    if (!valeur) return '—'
    return new Date(valeur).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function DetailFacture({ facture, onRecharger, onFermer }) {
    const [erreur, setErreur] = useState(null)
    const [alertes, setAlertes] = useState([])
    const [enCours, setEnCours] = useState(false)
    const [encaissementOuvert, setEncaissementOuvert] = useState(false)
    const [recherche, setRecherche] = useState('')
    const [resultats, setResultats] = useState([])
    const [articleChoisi, setArticleChoisi] = useState(null)
    const [quantite, setQuantite] = useState('1')

    const brouillon = facture.statut === 'brouillon'
    const reste = Number(facture.reste_a_payer)
    const client = facture.client
    const nomClient = client.prenom ? `${client.prenom} ${client.nom}` : client.nom

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

    async function agir(action) {
        setErreur(null)
        setEnCours(true)
        try {
            await action()
            setEncaissementOuvert(false)
            await onRecharger()
        } catch (e) {
            setErreur(e.message)
        } finally {
            setEnCours(false)
        }
    }

    function retirerLigne(ligne) {
        if (!confirm(`Retirer « ${ligne.designation} » de la facture ?`)) return
        agir(() => supprimerLigneFacture(facture.id, ligne.id))
    }

    function valider() {
        if (!confirm(`Valider la facture ${facture.numero} sans paiement ?`)) return
        agir(() => validerFacture(facture.id, null))
    }

    function rouvrir() {
        if (!confirm(`Rouvrir la facture ${facture.numero} pour la modifier ?`)) return
        agir(() => rouvrirFacture(facture.id))
    }

    function choisirArticle(article) {
        setArticleChoisi(article)
        setQuantite('1')
        setRecherche('')
        setResultats([])
    }

    async function ajouterArticle() {
        if (!articleChoisi) return
        const q = Math.max(1, parseInt(quantite, 10) || 1)
        setErreur(null)
        setEnCours(true)
        try {
            const rep = await ajouterLignesFacture(facture.id, [
                { article_id: articleChoisi.id, quantite: q },
            ])
            setAlertes(rep.articles_indisponibles || [])
            setArticleChoisi(null)
            setQuantite('1')
            await onRecharger()
        } catch (e) {
            setErreur(e.message)
        } finally {
            setEnCours(false)
        }
    }

    return (
        <div className="panneau">
            <div className="entete-panneau">
                <h3>
                    Facture {facture.numero}{' '}
                    <span className={`pastille ${brouillon ? 'brouillon' : 'validee'}`}>
                        {brouillon ? 'Brouillon' : 'Validée'}
                    </span>{' '}
                    <span className={`pastille ${facture.statut_paiement}`}>
                        {LIBELLES_PAIEMENT[facture.statut_paiement] ?? facture.statut_paiement}
                    </span>
                </h3>
                <button onClick={onFermer}>Fermer</button>
            </div>

            <p className="infos">
                Client : <strong>{nomClient}</strong> · {client.telephone}
                <br />
                Créée le {formaterDate(facture.date_creation)}
                {facture.date_derniere_modification && (
                    <> · Modifiée le <strong>{formaterDate(facture.date_derniere_modification)}</strong></>
                )}
                {facture.nb_reouvertures > 0 && <> · Réouvertures : {facture.nb_reouvertures}</>}
            </p>

            {erreur && <p className="erreur">{erreur}</p>}
            {alertes.length > 0 && (
                <ul className="avertissement">
                    {alertes.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
            )}
            {reste < 0 && (
                <p className="erreur" style={{ fontWeight: 600 }}>
                    Les paiements ({fcfa(facture.montant_paye)}) dépassent le total TTC ({fcfa(facture.total_ttc)}) :
                    à régulariser.
                </p>
            )}

            <table className="liste">
                <thead>
                <tr>
                    <th>Désignation</th>
                    <th className="droite">Prix HT</th>
                    <th className="droite">Qté</th>
                    <th className="droite">Montant HT</th>
                    {brouillon && <th></th>}
                </tr>
                </thead>
                <tbody>
                {facture.lignes.map((l) => (
                    <tr key={l.id}>
                        <td>{l.designation}</td>
                        <td className="droite">{fcfa(l.prix_unitaire_ht)}</td>
                        <td className="droite">{l.quantite}</td>
                        <td className="droite">{fcfa(l.montant_ht)}</td>
                        {brouillon && (
                            <td className="droite">
                                <button className="discret" disabled={enCours} onClick={() => retirerLigne(l)}>
                                    Retirer
                                </button>
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
            </table>

            <div className="totaux">
                <div>Total HT : {fcfa(facture.total_ht)}</div>
                <div>TVA (18 %) : {fcfa(facture.total_tva)}</div>
                <div className="total-ttc">Total TTC : {fcfa(facture.total_ttc)}</div>
                {facture.paiements.map((p) => (
                    <div key={p.id}>
                        {MODES[p.mode] ?? p.mode} ({formaterDate(p.date_paiement)}) : {fcfa(p.montant)}
                    </div>
                ))}
                <div>Déjà payé : {fcfa(facture.montant_paye)}</div>
                <div className={`reste-final ${reste > 0 ? 'a-payer' : 'solde'}`}>
                    Reste à payer : {fcfa(reste)}
                </div>
            </div>

            {brouillon && (
                <div>
                    <h4>Ajouter un article</h4>
                    <input
                        className="recherche"
                        placeholder="Rechercher un article (référence ou désignation)…"
                        value={recherche}
                        onChange={(e) => {
                            setRecherche(e.target.value)
                            if (e.target.value.trim().length < 2) setResultats([])
                        }}
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
                                    value={quantite}
                                    onChange={(e) => setQuantite(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') { e.preventDefault(); ajouterArticle() }
                                    }}
                                />
                            </label>
                            <button className="principal" disabled={enCours} onClick={ajouterArticle}>Ajouter</button>
                            <button onClick={() => setArticleChoisi(null)}>Annuler</button>
                        </div>
                    )}
                </div>
            )}

            <div className="boutons">
                {brouillon && (
                    <>
                        <button
                            className="principal"
                            disabled={enCours || facture.lignes.length === 0 || reste <= 0}
                            onClick={() => setEncaissementOuvert(true)}
                        >
                            Valider et encaisser
                        </button>
                        <button disabled={enCours || facture.lignes.length === 0} onClick={valider}>
                            Valider sans paiement
                        </button>
                    </>
                )}
                {!brouillon && reste > 0 && (
                    <button className="principal" disabled={enCours} onClick={() => setEncaissementOuvert(true)}>
                        Encaisser
                    </button>
                )}
                {!brouillon && (
                    <button disabled={enCours} onClick={rouvrir}>Rouvrir pour modifier</button>
                )}
            </div>

            {encaissementOuvert && (
                <div style={{ marginTop: '1rem' }}>
                    <FormulaireEncaissement
                        facture={facture}
                        onEncaisse={() => agir(async () => {})}
                        onAnnuler={() => setEncaissementOuvert(false)}
                    />
                </div>
            )}
        </div>
    )
}