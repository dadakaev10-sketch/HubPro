/**
 * Gemini AI Service
 * Nutzt die Gemini REST API direkt (kein SDK benötigt).
 * ENV: VITE_GEMINI_API_KEY
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const MODEL   = 'gemini-2.5-flash'
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

function stripJson(text) {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

async function callGemini(parts) {
  if (!API_KEY) throw new Error('VITE_GEMINI_API_KEY nicht konfiguriert. Bitte in .env eintragen.')

  const res = await fetch(`${BASE_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.7 },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Gemini API Fehler (${res.status})`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return stripJson(text)
}

export const geminiService = {
  isConfigured: Boolean(import.meta.env.VITE_GEMINI_API_KEY),

  /**
   * Analysiert ein Bild auf Viral-Potenzial.
   * @param {string} imageBase64 – Base64-kodiertes Bild
   * @param {string} mimeType    – z.B. "image/jpeg"
   * @param {string} platform    – z.B. "Instagram"
   * @param {string} category    – z.B. "Fashion"
   */
  async analyzeViralPotential({ imageBase64, mimeType, platform, category }) {
    const prompt = `Du bist ein Social-Media-Experte und analysierst Bilder auf ihr Viral-Potenzial.
Schreibe alle Textwerte auf Deutsch.

Analysiere dieses Bild für die Plattform "${platform}" in der Kategorie "${category}".
Antworte NUR mit gültigem JSON — keine Markdown-Code-Fences, keine Erklärungen davor oder danach.

Pflichtfelder:
{
  "viralScore": <Ganzzahl 0-100>,
  "imageContent": "<Was ist auf dem Bild zu sehen? 1-2 Sätze>",
  "scores": {
    "bildqualitaet": <0-100>,
    "hookFaktor": <0-100>,
    "trendRelevanz": <0-100>,
    "engagementPotenzial": <0-100>
  },
  "wasGutIst": ["<Stärke 1>", "<Stärke 2>", "<Stärke 3>"],
  "wasVerbessern": ["<Tipp 1>", "<Tipp 2>", "<Tipp 3>"],
  "bestPostingTime": "<z.B. Di–Do, 18–20 Uhr>",
  "trendWindow": "<aktueller Trend + Veränderung in %, z.B. 'Morning Routine ↑ 23%'>",
  "captions": {
    "locker": "<lockere Caption mit passenden Emojis, max. 100 Zeichen>",
    "storytelling": "<emotionale Story-Caption, 150-250 Zeichen>",
    "cta": "<Call-to-Action Caption mit Frage an die Community, 180-280 Zeichen>"
  },
  "hashtags": {
    "trending": ["#tag1","#tag2","#tag3","#tag4","#tag5"],
    "nische":   ["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7","#tag8"],
    "micro":    ["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7"]
  }
}`
    const text = await callGemini([
      { text: prompt },
      { inline_data: { mime_type: mimeType, data: imageBase64 } },
    ])
    return JSON.parse(text)
  },

  /**
   * Generiert einen vollständigen SEO-Artikel.
   */
  async generateSEOContent({ keyword, contentType, tonality, wordCount, focusKeywords, language }) {
    const lang   = language === 'en' ? 'English' : 'Deutsch'
    const extraKw = focusKeywords?.trim() ? `\nZusätzliche Fokus-Keywords: ${focusKeywords}` : ''

    const prompt = `Du bist ein erfahrener SEO-Texter. Generiere einen vollständigen, hochoptimierten SEO-Artikel.

Haupt-Keyword: "${keyword}"
Content-Typ: ${contentType}
Tonalität: ${tonality}
Ziel-Wortanzahl: ~${wordCount} Wörter
Sprache: ${lang}${extraKw}

Antworte NUR mit gültigem JSON (keine Markdown-Fences, kein Code-Block):
{
  "title": "H1-Überschrift mit Haupt-Keyword (50-70 Zeichen)",
  "metaTitle": "SEO-Meta-Titel max. 60 Zeichen mit Keyword",
  "metaDescription": "Ansprechende Meta-Description 120-160 Zeichen mit Keyword",
  "htmlContent": "Vollständiger Artikel-HTML mit <h2>, <h3>, <p>, <ul>, <li>, <strong> Tags. Einleitung + 4-6 Abschnitte mit Überschriften + Fazit. ~${wordCount} Wörter. Keyword-Dichte 1-2 %.",
  "keywords": ["haupt-keyword", "neben-keyword-1", "neben-keyword-2", "neben-keyword-3", "neben-keyword-4"]
}`
    const text = await callGemini([{ text: prompt }])
    return JSON.parse(text)
  },
}
