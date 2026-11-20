import { useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, FileText, Users, Package,
    Receipt, Store, Wallet, ShoppingCart, Barcode,
} from 'lucide-react'

const boutons = [
    { label: 'Tableau de bord', Icone: LayoutDashboard, description: 'Ventes et encaissements', chemin: '/tableau-de-bord' },
    { label: 'Factures', Icone: FileText, description: 'Créer et suivre les factures', chemin: '/factures' },
    { label: 'Clients', Icone: Users, description: 'Votre répertoire clients', chemin: '/clients' },
    { label: 'Articles', Icone: Package, description: 'Produits et stock', chemin: '/articles' },
]

export default function Accueil() {
    const navigate = useNavigate()

    return (
        <div className="accueil">
            <div className="accueil-filigrane" aria-hidden="true">
                <Receipt className="f f1" size={120} />
                <Store className="f f2" size={140} />
                <Wallet className="f f3" size={100} />
                <ShoppingCart className="f f4" size={130} />
                <Barcode className="f f5" size={110} />
            </div>

            <h1 className="accueil-titre">Facturation</h1>
            <p className="accueil-sous-titre">Que souhaitez-vous faire ?</p>
            <div className="accueil-grille">
                {boutons.map(({ label, Icone, description, chemin }) => (
                    <button
                        key={chemin}
                        className="accueil-carte"
                        onClick={() => navigate(chemin)}
                    >
                        <span className="accueil-icone">
                            <Icone size={44} strokeWidth={1.5} />
                        </span>
                        <span className="accueil-label">{label}</span>
                        <span className="accueil-desc">{description}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}