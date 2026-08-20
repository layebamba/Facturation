import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Articles from './pages/Articles'
import Clients from './pages/Clients'

const styleLien = ({ isActive }) => ({
    padding: '0.5rem 1rem',
    textDecoration: 'none',
    color: isActive ? '#0d6efd' : '#444',
    fontWeight: isActive ? 600 : 400,
    borderBottom: isActive ? '2px solid #0d6efd' : '2px solid transparent',
})

export default function App() {
    return (
        <BrowserRouter>
            <nav style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid #ddd',
                padding: '0 2rem',
                fontFamily: 'system-ui',
            }}>
                <NavLink to="/articles" style={styleLien}>Articles</NavLink>
                <NavLink to="/clients" style={styleLien}>Clients</NavLink>
                <NavLink to="/factures" style={styleLien}>Factures</NavLink>
            </nav>

            <Routes>
                <Route path="/" element={<Navigate to="/articles" replace />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="*" element={<p style={{ padding: '2rem' }}>Page introuvable.</p>} />
            </Routes>
        </BrowserRouter>
    )
}