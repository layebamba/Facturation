import { useEffect, useState } from 'react'
import { listerArticles } from './api'

export default function App() {
  const [articles, setArticles] = useState([])
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    listerArticles()
        .then(setArticles)
        .catch((e) => setErreur(e.message))
  }, [])

  return (
      <div style={{ maxWidth: 820, margin: '2rem auto', fontFamily: 'system-ui' }}>
        <h1>Articles — Boutique</h1>

        {erreur && <p style={{ color: 'crimson' }}>{erreur}</p>}

        {!erreur && articles.length === 0 && (
            <p>Aucun article pour l'instant.</p>
        )}

        {articles.length > 0 && (
            <table width="100%" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
              <thead>
              <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                <th>Référence</th>
                <th>Désignation</th>
                <th style={{ textAlign: 'right' }}>Prix HT</th>
                <th style={{ textAlign: 'right' }}>Stock</th>
                <th style={{ textAlign: 'right' }}>Seuil</th>
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
                    <td style={{ textAlign: 'right' }}>{Number(a.prix_unitaire_ht).toLocaleString('fr-FR')} F</td>
                    <td style={{ textAlign: 'right' }}>{a.quantite_stock}</td>
                    <td style={{ textAlign: 'right' }}>{a.seuil_alerte}</td>
                  </tr>
              ))}
              </tbody>
            </table>
        )}
      </div>
  )
}