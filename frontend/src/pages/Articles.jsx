import { useEffect, useState } from 'react'
import {
    listerArticles,
    creerArticle,
    modifierArticle,
    basculerActivationArticle,
} from '../api'
import FormulaireArticle from '../components/FormulaireArticle'

export default function Articles() {
    const [articles, setArticles] = useState([])
    const [erreur, setErreur] = useState(null)
    const [formulaireOuvert, setFormulaireOuvert] = useState(false)
    const [articleEnEdition, setArticleEnEdition] = useState(null)

    async function recharger() {
        try {
            setArticles(await listerArticles())
            setErreur(null)
        } catch (e) {
            setErreur(e.message)
        }
    }

    useEffect(() => {
        let annule = false
        listerArticles()
            .then((data) => { if (!annule) { setArticles(data); setErreur(null) } })
            .catch((e) => { if (!annule) setErreur(e.message) })
        return () => { annule = true }
    }, [])

    function ouvrirCreation() {
        setArticleEnEdition(null)
        setFormulaireOuvert(true)
        setErreur(null)
    }

    function ouvrirEdition(article) {
        setArticleEnEdition(article)
        setFormulaireOuvert(true)
        setErreur(null)
    }

    function fermer() {
        setFormulaireOuvert(false)
        setArticleEnEdition(null)
    }

    async function valider(donnees) {
        try {
            if (articleEnEdition) {
                await modifierArticle(articleEnEdition.id, donnees)
            } else {
                await creerArticle(donnees)
            }
            fermer()
            await recharger()
        } catch (e) {
            setErreur(e.message)   // le formulaire reste ouvert pour correction
        }
    }

    async function basculer(article) {
        const action = article.actif ? 'Désactiver' : 'Réactiver'
        if (!confirm(`${action} « ${article.designation} » ?`)) return
        try {
            await basculerActivationArticle(article.id)
            await recharger()
        } catch (e) {
            setErreur(e.message)
        }
    }

    return (
        <div className="page">
            <div className="entete-page">
                <h1>Articles</h1>
                {!formulaireOuvert && (
                    <button className="principal" onClick={ouvrirCreation}>+ Nouvel article</button>
                )}
            </div>

            {erreur && <p className="erreur">{erreur}</p>}

            {formulaireOuvert && (
                <div style={{ marginBottom: '1rem' }}>
                    <FormulaireArticle
                        article={articleEnEdition}
                        onValider={valider}
                        onAnnuler={fermer}
                    />
                </div>
            )}

            {articles.length === 0 && !erreur && <p>Aucun article pour l'instant.</p>}

            {articles.length > 0 && (
                <div className="cadre-tableau">
                    <table className="liste">
                        <thead>
                        <tr>
                            <th>Référence</th>
                            <th>Désignation</th>
                            <th className="droite">Prix HT</th>
                            <th className="droite">Stock</th>
                            <th className="droite">Seuil</th>
                            <th>État</th>
                            <th className="droite">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {articles.map((a) => {
                            const enAlerte = a.quantite_stock < a.seuil_alerte
                            return (
                                <tr
                                    key={a.id}
                                    className={!a.actif ? 'inactif' : enAlerte ? 'alerte' : ''}
                                >
                                    <td>{a.reference}</td>
                                    <td>{a.designation}</td>
                                    <td className="droite">
                                        {Number(a.prix_unitaire_ht).toLocaleString('fr-FR')} F
                                    </td>
                                    <td className="droite">
                                        {enAlerte ? <strong>{a.quantite_stock}</strong> : a.quantite_stock}
                                    </td>
                                    <td className="droite">{a.seuil_alerte}</td>
                                    <td>
                                        <span className={`pastille ${a.actif ? 'actif' : 'inactif'}`}>
                                            {a.actif ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                    <td className="actions">
                                        <button onClick={() => ouvrirEdition(a)}>Modifier</button>{' '}
                                        <button className="discret" onClick={() => basculer(a)}>
                                            {a.actif ? 'Désactiver' : 'Réactiver'}
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}