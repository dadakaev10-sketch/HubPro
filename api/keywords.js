/**
 * Vercel Serverless Function: Google Ads Keyword Planner Proxy
 *
 * Required env vars:
 *   GOOGLE_ADS_DEVELOPER_TOKEN   – your Google Ads developer token
 *   GOOGLE_ADS_CLIENT_ID         – OAuth2 client ID
 *   GOOGLE_ADS_CLIENT_SECRET     – OAuth2 client secret
 *   GOOGLE_ADS_REFRESH_TOKEN     – long-lived refresh token
 *   GOOGLE_ADS_CUSTOMER_ID       – Google Ads account ID (e.g. 123-456-7890)
 *   GOOGLE_ADS_LOGIN_CUSTOMER_ID – (optional) MCC manager account ID
 */

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_ADS_API = 'https://googleads.googleapis.com/v19'

async function getAccessToken() {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || 'Failed to get access token')
  }
  return data.access_token
}

function getTrend(monthlyVolumes) {
  if (!Array.isArray(monthlyVolumes) || monthlyVolumes.length < 6) return 'stable'
  const recent = monthlyVolumes.slice(-3).reduce((s, m) => s + (Number(m.monthlySearches) || 0), 0)
  const older  = monthlyVolumes.slice(-6, -3).reduce((s, m) => s + (Number(m.monthlySearches) || 0), 0)
  if (recent > older * 1.1) return 'up'
  if (recent < older * 0.9) return 'down'
  return 'stable'
}

export default async function handler(req, res) {
  // CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { keyword, language = '1009', country = '2276', limit = '20' } = req.query

  if (!keyword?.trim()) {
    return res.status(400).json({ error: 'keyword parameter required' })
  }

  // Check config
  const required = ['GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_SECRET', 'GOOGLE_ADS_REFRESH_TOKEN', 'GOOGLE_ADS_CUSTOMER_ID']
  const missing = required.filter(k => !process.env[k])
  if (missing.length) {
    return res.status(500).json({ error: `Missing env vars: ${missing.join(', ')}` })
  }

  try {
    const accessToken = await getAccessToken()
    const customerId  = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '')

    const headers = {
      'Authorization':   `Bearer ${accessToken}`,
      'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      'Content-Type':    'application/json',
    }
    if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
      headers['login-customer-id'] = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, '')
    }

    const apiRes = await fetch(
      `${GOOGLE_ADS_API}/customers/${customerId}/keywordPlanIdeas:generateKeywordIdeas`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          keywordSeed:        { keywords: [keyword.trim()] },
          language:           `languageConstants/${language}`,
          geoTargetConstants: [`geoTargetConstants/${country}`],
          includeAdultKeywords: false,
          keywordPlanNetwork: 'GOOGLE_SEARCH',
        }),
      }
    )

    const data = await apiRes.json()

    if (!apiRes.ok) {
      const msg = data.error?.message || data.error?.details?.[0]?.errors?.[0]?.message || 'Google Ads API error'
      return res.status(apiRes.status).json({ error: msg })
    }

    const results = (data.results || []).slice(0, Number(limit)).map(item => {
      const metrics = item.keywordIdeaMetrics || {}
      return {
        keyword:         item.text,
        volume:          Number(metrics.avgMonthlySearches) || 0,
        difficulty:      Math.round((Number(metrics.competitionIndex) || 0) * 100 / 100),
        cpc:             parseFloat(((Number(metrics.averageCpcMicros) || 0) / 1_000_000).toFixed(2)),
        trend:           getTrend(metrics.monthlySearchVolumes),
        relatedKeywords: [],
      }
    })

    return res.status(200).json(results)
  } catch (err) {
    console.error('[keywords api]', err)
    return res.status(500).json({ error: err.message })
  }
}
