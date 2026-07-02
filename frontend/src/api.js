const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function listerArticles() {
    const res = await fetch(`${API_URL}/articles`)
    if (!res.ok) throw new Error('Impossible de charger les articles')
    return res.json()
}