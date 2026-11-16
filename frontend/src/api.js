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
async function recupererPdfFacture(id) {
    const res = await fetch(`${API_URL}/factures/${id}/pdf`)
    await verifier(res, 'Impossible de générer le PDF')
    return res.blob()
}

/** Enregistre le PDF sur l'ordinateur (ex. FAC-2026-00002.pdf). */
export async function telechargerPdfFacture(id, numero) {
    const blob = await recupererPdfFacture(id)
    const url = URL.createObjectURL(blob)
    const lien = document.createElement('a')
    lien.href = url
    lien.download = `${numero || `facture-${id}`}.pdf`
    document.body.appendChild(lien)
    lien.click()
    lien.remove()
    URL.revokeObjectURL(url)
}

/** Charge le PDF dans un cadre invisible et lance la boîte d'impression. */
export async function imprimerPdfFacture(id) {
    const blob = await recupererPdfFacture(id)
    const url = URL.createObjectURL(blob)
    const cadre = document.createElement('iframe')
    cadre.style.cssText = 'position:fixed;width:0;height:0;border:0;'
    cadre.src = url
    cadre.onload = () => {
        cadre.contentWindow.focus()
        cadre.contentWindow.print()
        // on nettoie après un délai, le temps que l'impression démarre
        setTimeout(() => {
            cadre.remove()
            URL.revokeObjectURL(url)
        }, 60000)
    }
    document.body.appendChild(cadre)
}
export async function listerFactures() {
    const res = await fetch(`${API_URL}/factures`)
    await verifier(res, 'Impossible de charger les factures')
    return res.json()
}
export async function creerFacture(donnees) {
    const res = await fetch(`${API_URL}/factures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donnees),
    })
    if (!res.ok) {
        let detail = 'Impossible de créer la facture'
        try {
            const corps = await res.json()
            if (typeof corps.detail === 'string') {
                detail = corps.detail
            } else if (corps.detail?.message) {
                // cas « aucun article disponible » (409) : message + alertes
                detail = corps.detail.message
                if (corps.detail.alertes?.length) detail += ' : ' + corps.detail.alertes.join(' ; ')
            } else if (Array.isArray(corps.detail)) {
                detail = corps.detail.map((d) => d.msg).join(' ; ')
            }
        } catch {
            // corps vide ou non-JSON : on garde le message par défaut
        }
        throw new Error(detail)
    }
    return res.json()
}
export async function validerFacture(id, paiement) {
    const res = await fetch(`${API_URL}/factures/${id}/valider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paiement: paiement || null }),
    })
    await verifier(res, 'Impossible de valider la facture')
    return res.json()
}
export async function encaisserPaiement(id, paiement) {
    const res = await fetch(`${API_URL}/factures/${id}/paiements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paiement),
    })
    await verifier(res, "Impossible d'enregistrer le paiement")
    return res.json()
}
export async function rouvrirFacture(id) {
    const res = await fetch(`${API_URL}/factures/${id}/rouvrir`, { method: 'POST' })
    await verifier(res, 'Impossible de rouvrir la facture')
    return res.json()
}

export async function supprimerLigneFacture(id, ligneId) {
    const res = await fetch(`${API_URL}/factures/${id}/lignes/${ligneId}`, { method: 'DELETE' })
    await verifier(res, 'Impossible de retirer la ligne')
    return res.json()
}

export async function ajouterLignesFacture(id, lignes) {
    const res = await fetch(`${API_URL}/factures/${id}/lignes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lignes),
    })
    await verifier(res, "Impossible d'ajouter les articles")
    return res.json()
}
export async function obtenirStats() {
    const res = await fetch(`${API_URL}/stats/tableau-de-bord`)
    await verifier(res, 'Impossible de charger le tableau de bord')
    return res.json()
}