import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { obtenirStats } from '../api'

function fcfa(valeur) {
    return `${Math.round(Number(valeur)).toLocaleString('fr-FR')} F`
}

function pluriel(n, mot) {
    return `${n} ${mot}${n > 1 ? 's' : ''}`
}

function Periode({ titre, ventes, encaisse }) {
    return (
        <div className="panneau">
            <h3>{titre}</h3>
            <div className="ligne-chiffre">
                <span>
                    Ventes
                    <div className="sous-texte">{pluriel(ventes.nb, 'facture')} validée{ventes.nb > 1 ? 's' : ''}</div>
                </span>
                <strong>{fcfa(ventes.total)}</strong>
            </div>
            <div className="ligne-chiffre">
                <span>Encaissé</span>
                <strong>{fcfa(encaisse)}</strong>
            </div>
        </div>
    )
}

export default function TableauDeBord() {
    const [stats, setStats] = useState(null)
    const [erreur, setErreur] = useState(null)

    useEffect(() => {
        let annule = false
        obtenirStats()
            .then((data) => { if (!annule) { setStats(data); setErreur(null) } })
            .catch((e) => { if (!annule) setErreur(e.message) })
        return () => { annule = true }
    }, [])

    return (
        <div className="page">
            <div className="entete-page">
                <h1>Tableau de bord</h1>
            </div>

            {erreur && <p className="erreur">{erreur}</p>}
            {!stats && !erreur && <p>Chargement…</p>}

            {stats && (
                <>
                    <div className="panneau a-encaisser">
                        <div>
                            <div className="sous-texte">Reste à encaisser</div>
                            <div className={`gros ${stats.impayes.total > 0 ? 'a-payer' : 'solde'}`}>
                                {fcfa(stats.impayes.total)}
                            </div>
                            <div className="sous-texte">
                                {stats.impayes.nb === 0
                                    ? 'Toutes les factures validées sont soldées.'
                                    : `${pluriel(stats.impayes.nb, 'facture')} non soldée${stats.impayes.nb > 1 ? 's' : ''}`}
                                {stats.brouillons > 0 && ` · ${pluriel(stats.brouillons, 'brouillon')} à finaliser`}
                            </div>
                        </div>
                        <Link to="/factures">Voir les factures</Link>
                    </div>

                    <div className="deux-colonnes">
                        <Periode
                            titre="Aujourd'hui"
                            ventes={stats.ventes_jour}
                            encaisse={stats.encaisse_jour}
                        />
                        <Periode
                            titre="Ce mois"
                            ventes={stats.ventes_mois}
                            encaisse={stats.encaisse_mois}
                        />
                    </div>

                    <h3 className="section-titre">Stock en alerte</h3>
                    {stats.stock_alerte.length === 0 ? (
                        <p>Aucun article sous son seuil d'alerte.</p>
                    ) : (
                        <div className="cadre-tableau">
                            <table className="liste">
                                <thead>
                                <tr>
                                    <th>Référence</th>
                                    <th>Désignation</th>
                                    <th className="droite">Stock</th>
                                    <th className="droite">Seuil</th>
                                </tr>
                                </thead>
                                <tbody>
                                {stats.stock_alerte.map((a) => (
                                    <tr key={a.id} className="alerte">
                                        <td>{a.reference}</td>
                                        <td>{a.designation}</td>
                                        <td className="droite"><strong>{a.quantite_stock}</strong></td>
                                        <td className="droite">{a.seuil_alerte}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <h3 className="section-titre">Articles les plus vendus ce mois</h3>
                    {stats.top_articles.length === 0 ? (
                        <p>Aucune vente ce mois-ci.</p>
                    ) : (
                        <div className="cadre-tableau">
                            <table className="liste">
                                <thead>
                                <tr>
                                    <th>Désignation</th>
                                    <th className="droite">Quantité vendue</th>
                                    <th className="droite">Montant HT</th>
                                </tr>
                                </thead>
                                <tbody>
                                {stats.top_articles.map((a) => (
                                    <tr key={a.designation}>
                                        <td>{a.designation}</td>
                                        <td className="droite">{a.quantite}</td>
                                        <td className="droite">{fcfa(a.montant_ht)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}