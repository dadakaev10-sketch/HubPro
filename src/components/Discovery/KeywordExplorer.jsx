import { useState, useMemo, Fragment } from 'react'
import { Search, TrendingUp, TrendingDown, Minus, ArrowUpDown, BarChart3, DollarSign, Target, ChevronDown, ChevronRight, AlertCircle, Loader2 } from 'lucide-react'
import { keywordData } from '../../data/mockData'

const IS_CONFIGURED = Boolean(
  import.meta.env.VITE_GOOGLE_ADS_ENABLED === 'true'
)

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
}

const trendColors = {
  up: 'text-green-600',
  down: 'text-red-600',
  stable: 'text-gray-500',
}

const difficultyColor = (d) => {
  if (d <= 30) return 'bg-green-500'
  if (d <= 50) return 'bg-yellow-500'
  if (d <= 70) return 'bg-orange-500'
  return 'bg-red-500'
}

export default function KeywordExplorer() {
  const [searchTerm, setSearchTerm]   = useState('')
  const [sortBy, setSortBy]           = useState('volume')
  const [sortDir, setSortDir]         = useState('desc')
  const [expandedRow, setExpandedRow] = useState(null)
  const [results, setResults]         = useState(null)   // null = show mock
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [lastQuery, setLastQuery]     = useState('')

  // Active dataset: real results or mock fallback
  const dataset = results ?? keywordData

  const filtered = useMemo(() => {
    const list = dataset.filter(kw =>
      kw.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kw.relatedKeywords?.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    return list.sort((a, b) => {
      const mult = sortDir === 'desc' ? -1 : 1
      return mult * (a[sortBy] - b[sortBy])
    })
  }, [dataset, searchTerm, sortBy, sortDir])

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('desc') }
  }

  const avgVolume     = Math.round(dataset.reduce((s, k) => s + k.volume, 0) / (dataset.length || 1))
  const avgDifficulty = Math.round(dataset.reduce((s, k) => s + k.difficulty, 0) / (dataset.length || 1))
  const avgCpc        = (dataset.reduce((s, k) => s + k.cpc, 0) / (dataset.length || 1)).toFixed(2)

  async function handleSearch(e) {
    e.preventDefault()
    const q = searchTerm.trim()
    if (!q || q === lastQuery) return
    if (!IS_CONFIGURED) return   // fall through to mock filter only

    setLoading(true)
    setError('')
    try {
      const res  = await fetch(`/api/keywords?keyword=${encodeURIComponent(q)}&limit=30`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'API-Fehler')
      setResults(data)
      setLastQuery(q)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Config banner */}
      {!IS_CONFIGURED && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <strong>Demo-Modus:</strong> Google Ads API nicht konfiguriert — es werden Beispieldaten angezeigt.
            Füge <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">VITE_GOOGLE_ADS_ENABLED=true</code> und die Server-Variablen in Vercel ein.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Avg. Suchvolumen',   value: avgVolume.toLocaleString('de-DE'), icon: BarChart3, color: 'text-brand-600' },
          { label: 'Avg. Schwierigkeit', value: avgDifficulty + '/100',            icon: Target,    color: 'text-orange-600' },
          { label: 'Avg. CPC',           value: avgCpc + ' €',                    icon: DollarSign, color: 'text-green-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card px-4 py-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={IS_CONFIGURED ? 'Keyword eingeben und Enter drücken…' : 'Keyword filtern (Demo)…'}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); if (results) setResults(null) }}
            className="input pl-11 text-base py-3 w-full"
          />
        </div>
        {IS_CONFIGURED && (
          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            className="btn-primary px-5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Suche…' : 'Suchen'}
          </button>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Keyword</th>
              {[
                { key: 'volume',     label: 'Volumen' },
                { key: 'difficulty', label: 'Schwierigkeit' },
                { key: 'cpc',        label: 'CPC' },
              ].map(({ key, label }) => (
                <th key={key} className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3 hidden sm:table-cell">
                  <button onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 hover:text-gray-700">
                    {label}
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
              ))}
              <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">Trend</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {filtered.map((kw) => {
              const TrendIcon = trendIcons[kw.trend] || Minus
              const expanded  = expandedRow === kw.keyword
              return (
                <Fragment key={kw.keyword}>
                  <tr
                    onClick={() => setExpandedRow(expanded ? null : kw.keyword)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{kw.keyword}</p>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{kw.volume.toLocaleString('de-DE')}</span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${difficultyColor(kw.difficulty)}`} style={{ width: `${kw.difficulty}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{kw.difficulty}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{kw.cpc.toFixed(2)} €</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TrendIcon className={`w-4 h-4 mx-auto ${trendColors[kw.trend] || 'text-gray-500'}`} />
                    </td>
                    <td className="px-4 py-3">
                      {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </td>
                  </tr>
                  {expanded && kw.relatedKeywords?.length > 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-3 bg-gray-50 dark:bg-gray-800/30">
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-gray-500 mr-2">Verwandte Keywords:</span>
                          {kw.relatedKeywords.map(rk => (
                            <span key={rk} className="badge bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400">{rk}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                  {IS_CONFIGURED ? 'Keyword eingeben und suchen' : 'Keine Ergebnisse'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
