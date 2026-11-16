import { useRef } from 'react'
import {
    BrowserRouter,
    Routes,
    Route,
    NavLink,
    useNavigate,
    useLocation,
} from 'react-router-dom'
import Articles from './pages/Articles'
import Clients from './pages/Clients'
import Factures from './pages/Factures'
import TableauDeBord from './pages/TableauDeBord'
import Accueil from "./pages/Accueil";

// Ordre des pages, identique à celui du menu
const ORDRE = ['/tableau-de-bord', '/factures', '/clients', '/articles']
const SEUIL = 70   // distance minimale du geste, en pixels

// true  : glisser de la gauche vers la droite passe à la page suivante (Factures → Clients)
// false : sens inverse (glisser de la droite vers la gauche)
const GAUCHE_VERS_DROITE_POUR_SUIVANT = true

const classeLien = ({ isActive }) => (isActive ? 'lien actif' : 'lien')

function Lien({ vers, long, court }) {
    return (
        <NavLink to={vers} className={classeLien}>
            <span className="long">{long}</span>
            <span className="court">{court}</span>
        </NavLink>
    )
}

/** Vrai si l'élément (ou un parent) défile latéralement : le geste lui appartient alors. */
function defileLateralement(element) {
    for (let n = element; n && n !== document.body; n = n.parentElement) {
        if (n.scrollWidth > n.clientWidth + 1) {
            const mode = getComputedStyle(n).overflowX
            if (mode === 'auto' || mode === 'scroll') return true
        }
    }
    return false
}

function Pages() {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const depart = useRef(null)

    function debut(e) {
        const cible = e.target
        // on laisse tranquilles les champs de saisie et les zones qui défilent latéralement
        if (cible.closest('input, select, textarea') || defileLateralement(cible)) {
            depart.current = null
            return
        }
        const toucher = e.touches[0]
        depart.current = { x: toucher.clientX, y: toucher.clientY }
    }

    function fin(e) {
        if (!depart.current) return
        if (!window.matchMedia('(max-width: 700px)').matches) return   // téléphone seulement

        const toucher = e.changedTouches[0]
        const dx = toucher.clientX - depart.current.x
        const dy = toucher.clientY - depart.current.y
        depart.current = null

        // geste assez long et plutôt horizontal (pas un défilement vertical)
        if (Math.abs(dx) < SEUIL || Math.abs(dx) < Math.abs(dy) * 1.5) return

        const index = ORDRE.indexOf(pathname)
        if (index === -1) return

        const versSuivant = GAUCHE_VERS_DROITE_POUR_SUIVANT ? dx > 0 : dx < 0
        const cible = versSuivant ? index + 1 : index - 1
        if (cible < 0 || cible >= ORDRE.length) return
        navigate(ORDRE[cible])
    }
    return (
        <>
            {pathname !== '/' && (
                <nav className="menu">
                    <button className="btn-accueil" onClick={() => navigate('/')}>
                        ← Accueil
                    </button>
                    <span className="marque">Facturation</span>
                </nav>
            )}
            <main onTouchStart={debut} onTouchEnd={fin}>
                <Routes>
                    <Route path="/" element={<Accueil />} />
                    <Route path="/tableau-de-bord" element={<TableauDeBord />} />
                    <Route path="/factures" element={<Factures />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/articles" element={<Articles />} />
                    <Route path="*" element={<p style={{ padding: '2rem' }}>Page introuvable.</p>} />
                </Routes>
            </main>
        </>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <Pages />
        </BrowserRouter>
    )
}