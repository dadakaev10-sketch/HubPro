/**
 * WordPress REST API Service
 * Unterstützt sowohl globale Env-Variablen als auch per-Kunden-Zugangsdaten aus Firestore.
 */

const ENV_URL  = (import.meta.env.VITE_WP_API_URL || '').replace(/\/$/, '')
const ENV_USER = import.meta.env.VITE_WP_USERNAME || ''
const ENV_PASS = import.meta.env.VITE_WP_APP_PASSWORD || ''

function makeHeaders(wpUrl, wpUser, wpPass) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Basic ${btoa(`${wpUser}:${wpPass}`)}`,
  }
}

function resolveCredentials(client) {
  if (client?.wpApiUrl && client?.wpUsername && client?.wpAppPassword) {
    return {
      url:  client.wpApiUrl.replace(/\/$/, ''),
      user: client.wpUsername,
      pass: client.wpAppPassword,
    }
  }
  return { url: ENV_URL, user: ENV_USER, pass: ENV_PASS }
}

export const wordpressService = {
  // true wenn globale Env-Variablen gesetzt sind
  isConfigured: Boolean(ENV_URL && ENV_USER && ENV_PASS),

  // true wenn dieser Kunde eigene WP-Zugangsdaten hinterlegt hat
  isConfiguredForClient(client) {
    return Boolean(client?.wpApiUrl && client?.wpUsername && client?.wpAppPassword)
  },

  /**
   * Erstellt oder aktualisiert einen WordPress-Beitrag.
   * @param {object} article  – Article-Objekt aus Firestore
   * @param {object} [client] – Kunden-Objekt mit optionalen wpApiUrl/wpUsername/wpAppPassword
   */
  async publishPost(article, client = null) {
    const { url, user, pass } = resolveCredentials(client)
    if (!url || !user || !pass) throw new Error('Keine WordPress-Zugangsdaten konfiguriert')

    const isUpdate = Boolean(article.wpPostId)
    const endpoint = isUpdate
      ? `${url}/wp-json/wp/v2/posts/${article.wpPostId}`
      : `${url}/wp-json/wp/v2/posts`

    const payload = {
      title:   article.title,
      content: article.htmlContent || '',
      status:  article.status === 'published' ? 'publish' : 'draft',
      slug:    article.slug || '',
      excerpt: article.metaData?.m_desc || '',
    }

    const res = await fetch(endpoint, {
      method:  isUpdate ? 'PUT' : 'POST',
      headers: makeHeaders(url, user, pass),
      body:    JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `WordPress-Fehler (${res.status})`)
    }

    const data = await res.json()
    return { wpPostId: data.id, wpPostUrl: data.link }
  },
}
