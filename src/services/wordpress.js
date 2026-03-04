/**
 * WordPress REST API Service
 * Veröffentlicht SEO-Artikel direkt zu einer WordPress-Installation.
 *
 * Benötigte Env-Variablen:
 *   VITE_WP_API_URL      = https://deine-website.de
 *   VITE_WP_USERNAME     = wordpress-benutzername
 *   VITE_WP_APP_PASSWORD = wordpress-application-password (Einstellungen → Sicherheit → App-Passwörter)
 */

const WP_URL = (import.meta.env.VITE_WP_API_URL || '').replace(/\/$/, '')
const WP_USER = import.meta.env.VITE_WP_USERNAME || ''
const WP_PASS = import.meta.env.VITE_WP_APP_PASSWORD || ''

function getHeaders() {
  const creds = btoa(`${WP_USER}:${WP_PASS}`)
  return {
    'Content-Type': 'application/json',
    Authorization: `Basic ${creds}`,
  }
}

export const wordpressService = {
  isConfigured: Boolean(WP_URL && WP_USER && WP_PASS),

  async testConnection() {
    const res = await fetch(`${WP_URL}/wp-json/wp/v2/users/me`, {
      headers: getHeaders(),
    })
    if (!res.ok) throw new Error('WordPress-Verbindung fehlgeschlagen')
    return res.json()
  },

  /**
   * Erstellt oder aktualisiert einen WordPress-Beitrag.
   * @param {object} article  – Article-Objekt aus Firestore
   * @returns {{ wpPostId: number, wpPostUrl: string }}
   */
  async publishPost(article) {
    const isUpdate = Boolean(article.wpPostId)
    const endpoint = isUpdate
      ? `${WP_URL}/wp-json/wp/v2/posts/${article.wpPostId}`
      : `${WP_URL}/wp-json/wp/v2/posts`

    const payload = {
      title: article.title,
      content: article.htmlContent || '',
      status: article.status === 'published' ? 'publish' : 'draft',
      slug: article.slug || '',
      excerpt: article.metaData?.m_desc || '',
    }

    const res = await fetch(endpoint, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `WordPress-Fehler (${res.status})`)
    }

    const data = await res.json()
    return { wpPostId: data.id, wpPostUrl: data.link }
  },
}
