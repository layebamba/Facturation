import { useEffect, useState } from 'react'
import {
    listerArticles,
    creerArticle,
    modifierArticle,
    basculerActivationArticle
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

    useEffect(() => {  let annule = false
        listerArticles()
            .then((data) => { if (!annule) { setArticles(data); setErreur(null) } })
            .catch((e) => { if (!annule) setErreur(e.message) })
        return () => { annule = true }}, [])

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
        <div style={{ maxWidth: 900, margin: '2rem auto', fontFamily: 'system-ui' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0 }}>Articles — Boutique</h1>
                {!formulaireOuvert && (
                    <button onClick={ouvrirCreation}>+ Nouvel article</button>
                )}
            </div>

            {erreur && (
                <p style={{ color: 'crimson', marginTop: '1rem' }}>{erreur}</p>
            )}

            {formulaireOuvert && (
                <div style={{ marginTop: '1rem' }}>
                    <FormulaireArticle
                        article={articleEnEdition}
                        onValider={valider}
                        onAnnuler={fermer}
                    />
                </div>
            )}

            {articles.length === 0 && !erreur && <p>Aucun article pour l'instant.</p>}

            {articles.length > 0 && (
                <table width="100%" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                    <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                        <th>Référence</th>
                        <th>Désignation</th>
                        <th style={{ textAlign: 'right' }}>Prix HT</th>
                        <th style={{ textAlign: 'right' }}>Stock</th>
                        <th style={{ textAlign: 'right' }}>Seuil</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {articles.map((a) => (
                        <tr
                            key={a.id}
                            style={{
                                borderBottom: '1px solid #eee',
                                background: a.quantite_stock < a.seuil_alerte ? '#fcebeb' : 'transparent',
                            }}
                        >
                            <td>{a.reference}</td>
                            <td>{a.designation}</td>
                            <td style={{ textAlign: 'right' }}>
                                {Number(a.prix_unitaire_ht).toLocaleString('fr-FR')} F
                            </td>
                            <td style={{ textAlign: 'right' }}>{a.quantite_stock}</td>
                            <td style={{ textAlign: 'right' }}>{a.seuil_alerte}</td>
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <button onClick={() => ouvrirEdition(a)}>Modifier</button>{' '}
                                <button onClick={() => basculer(a)}>
                                    {a.actif ? 'Désactiver' : 'Réactiver'}
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