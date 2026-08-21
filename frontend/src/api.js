const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/** Centralise la lecture des erreurs renvoyées par FastAPI. */
async function verifier(res, messageParDefaut) {
    if (res.ok) return
    let detail = messageParDefaut
    try {
        const corps = await res.json()
        if (typeof corps.detail === 'string') detail = corps.detail
    } catch {
        // corps vide ou non-JSON : on garde le message par défaut
    }
    throw new Error(detail)
}

export async function listerArticles() {
    const res = await fetch(`${API_URL}/articles`)
    await verifier(res, 'Impossible de charger les articles')
    return res.json()
}

export async function rechercherArticles(q) {
    const res = await fetch(`${API_URL}/articles/recherche?q=${encodeURIComponent(q)}`)
    await verifier(res, 'Recherche impossible')
    return res.json()
}

export async function obtenirArticle(id) {
    const res = await fetch(`${API_URL}/articles/${id}`)
    await verifier(res, 'Article introuvable')
    return res.json()
}

export async function creerArticle(donnees) {
    const res = await fetch(`${API_URL}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donnees),
    })
    await verifier(res, "Impossible de créer l'article")
    return res.json()
}

export async function modifierArticle(id, donnees) {
    const res = await fetch(`${API_URL}/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donnees),
    })
    await verifier(res, "Impossible de modifier l'article")
    return res.json()
}

export async function listerClients() {
    const res = await fetch(`${API_URL}/clients`)
    await verifier(res, 'Impossible de charger les clients')
    return res.json()
}

export async function creerClient(donnees) {
    const res = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donnees),
    })
    await verifier(res, 'Impossible de créer le client')
    return res.json()
}

export async function modifierClient(id, donnees) {
    const res = await fetch(`${API_URL}/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donnees),
    })
    await verifier(res, 'Impossible de modifier le client')
    return res.json()
}

export async function basculerActivationClient(id) {
    const res = await fetch(`${API_URL}/clients/${id}/activation`, { method: 'PATCH' })
    await verifier(res, "Impossible de changer l'état du client")
    return res.json()
}
export async function basculerActivationArticle(id) {
    const res = await fetch(`${API_URL}/articles/${id}/activation`, { method: 'PATCH' })
    await verifier(res, "Impossible de changer l'état de l'article")
    return res.json()
}