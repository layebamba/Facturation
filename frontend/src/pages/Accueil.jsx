import { useNavigate } from 'react-router-dom'

const boutons = [
    { label: 'Tableau de bord', icone: '📊', description: 'Ventes et encaissements', chemin: '/tableau-de-bord' },
    { label: 'Factures', icone: '🧾', description: 'Créer et suivre les factures', chemin: '/factures' },
    { label: 'Clients', icone: '👥', description: 'Votre répertoire clients', chemin: '/clients' },
    { label: 'Articles', icone: '📦', description: 'Produits et stock', chemin: '/articles' },
]

export default function Accueil() {
    const navigate = useNavigate()

    return (
        <div className="accueil">
            <h1 className="accueil-titre">Facturation</h1>
            <p className="accueil-sous-titre">Que souhaitez-vous faire ?</p>
            <div className="accueil-grille">
                {boutons.map((b) => (
                    <button
                        key={b.chemin}
                        className="accueil-carte"
                        onClick={() => navigate(b.chemin)}
                    >
                        <span className="accueil-icone">{b.icone}</span>
                        <span className="accueil-label">{b.label}</span>
                        <span className="accueil-desc">{b.description}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}