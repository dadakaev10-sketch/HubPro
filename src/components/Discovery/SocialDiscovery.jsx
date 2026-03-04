import { useState, useMemo } from 'react'
import { Compass, TrendingUp, Zap, Copy, Sparkles, Instagram, Linkedin, Facebook, Video, ArrowUpRight, Target, Lightbulb, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { geminiService } from '../../services/gemini'

const HOOK_FORMULAS = [
  { id: 'aida', name: 'AIDA', desc: 'Attention - Interest - Desire - Action', icon: Target },
  { id: 'pas',  name: 'PAS',  desc: 'Problem - Agitate - Solution',           icon: Zap },
  { id: 'bab',  name: 'BAB',  desc: 'Before - After - Bridge',                icon: ArrowUpRight },
  { id: 'fab',  name: 'FAB',  desc: 'Feature - Advantage - Benefit',          icon: Lightbulb },
]

const MOCK_HOOKS = [
  { id: 1, hook: 'Stoppt alles! Das müsst ihr sehen...', formula: 'aida', category: 'Aufmerksamkeit', platform: 'Instagram' },
  { id: 2, hook: '3 Fehler, die 90% aller Unternehmen machen (und wie du sie vermeidest)', formula: 'pas', category: 'Bildung', platform: 'LinkedIn' },
  { id: 3, hook: 'Vor 6 Monaten hatte ich 0 Follower. Heute: 50.000. Hier ist mein System:', formula: 'bab', category: 'Storytelling', platform: 'Instagram' },
  { id: 4, hook: 'Unpopuläre Meinung: Content Qualität > Content Quantität', formula: 'aida', category: 'Meinung', platform: 'LinkedIn' },
  { id: 5, hook: 'Das hat uns niemand gesagt, als wir gegründet haben...', formula: 'pas', category: 'Storytelling', platform: 'TikTok' },
  { id: 6, hook: 'POV: Du entdeckst den einfachsten Marketing-Hack aller Zeiten', formula: 'bab', category: 'Aufmerksamkeit', platform: 'TikTok' },
  { id: 7, hook: 'Warum verlierst du Follower? Die Antwort überrascht dich.', formula: 'pas', category: 'Bildung', platform: 'Instagram' },
  { id: 8, hook: 'Das Tool, das mein Business verändert hat (kein Clickbait)', formula: 'fab', category: 'Empfehlung', platform: 'LinkedIn' },
]

const MOCK_TRENDS = [
  { id: 1, topic: 'KI im Content Marketing',  platform: 'LinkedIn',  volume: 12400, growth: 156, category: 'Technologie' },
  { id: 2, topic: 'Authentischer Content',     platform: 'Instagram', volume: 8700,  growth: 89,  category: 'Strategie' },
  { id: 3, topic: 'Short-Form Video',          platform: 'TikTok',   volume: 45200, growth: 234, category: 'Format' },
  { id: 4, topic: 'Personal Branding 2024',    platform: 'LinkedIn',  volume: 6300,  growth: 67,  category: 'Strategie' },
  { id: 5, topic: 'UGC Marketing',             platform: 'Instagram', volume: 15800, growth: 123, category: 'Strategie' },
  { id: 6, topic: 'Community Building',        platform: 'Facebook',  volume: 4200,  growth: 45,  category: 'Engagement' },
  { id: 7, topic: 'Micro-Influencer',          platform: 'Instagram', volume: 9100,  growth: 78,  category: 'Kooperation' },
  { id: 8, topic: 'LinkedIn Carousel',         platform: 'LinkedIn',  volume: 7500,  growth: 112, category: 'Format' },
]

const platformIconMap  = { Instagram, LinkedIn: Linkedin, Facebook, TikTok: Video }
const platformColorMap = { Instagram: 'text-pink-500', LinkedIn: 'text-blue-600', Facebook: 'text-blue-500', TikTok: 'text-gray-800 dark:text-gray-200' }

export default function SocialDiscovery() {
  const [activeTab, setActiveTab]       = useState('trends')
  const [filterFormula, setFilterFormula] = useState('all')
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [copiedId, setCopiedId]         = useState(null)

  // Trends state
  const [trends, setTrends]             = useState(null)
  const [trendIndustry, setTrendIndustry] = useState('')
  const [trendPlatform, setTrendPlatform] = useState('all')
  const [loadingTrends, setLoadingTrends] = useState(false)
  const [trendError, setTrendError]     = useState('')

  // Hooks state
  const [hooks, setHooks]               = useState(null)
  const [hookTopic, setHookTopic]       = useState('')
  const [hookIndustry, setHookIndustry] = useState('')
  const [loadingHooks, setLoadingHooks] = useState(false)
  const [hookError, setHookError]       = useState('')

  const activeTrends = trends ?? MOCK_TRENDS
  const activeHooks  = hooks  ?? MOCK_HOOKS

  const filteredHooks = useMemo(() => {
    return activeHooks.filter(h => {
      const matchesFormula   = filterFormula === 'all'   || h.formula === filterFormula
      const matchesPlatform  = filterPlatform === 'all'  || h.platform === filterPlatform
      return matchesFormula && matchesPlatform
    })
  }, [activeHooks, filterFormula, filterPlatform])

  const copyHook = (hook, id) => {
    navigator.clipboard?.writeText(hook)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function handleGenerateTrends() {
    if (!geminiService.isConfigured) return
    setLoadingTrends(true)
    setTrendError('')
    try {
      const data = await geminiService.generateTrendingTopics({
        industry: trendIndustry,
        platform: trendPlatform,
      })
      setTrends(data.map((t, i) => ({ ...t, id: i + 1 })))
    } catch (err) {
      setTrendError(err.message)
    } finally {
      setLoadingTrends(false)
    }
  }

  async function handleGenerateHooks() {
    if (!geminiService.isConfigured || !hookTopic.trim()) return
    setLoadingHooks(true)
    setHookError('')
    try {
      const data = await geminiService.generateViralHooks({
        topic:    hookTopic,
        industry: hookIndustry,
        platform: filterPlatform,
        formula:  filterFormula,
      })
      setHooks(data.map((h, i) => ({ ...h, id: i + 1 })))
    } catch (err) {
      setHookError(err.message)
    } finally {
      setLoadingHooks(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-r from-brand-600 to-purple-600">
        <div className="flex items-center gap-3 mb-2">
          <Compass className="w-6 h-6 text-white" />
          <h2 className="text-xl font-bold text-white">Social Discovery Engine</h2>
        </div>
        <p className="text-brand-100 text-sm">
          Entdecke Trends, generiere Viral Hooks und finde datengetriebene Inspiration für deinen Content.
        </p>
      </div>

      {/* Config banner */}
      {!geminiService.isConfigured && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <strong>Demo-Modus:</strong> Füge <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">VITE_GEMINI_API_KEY</code> in Vercel ein, um KI-generierte Trends und Hooks zu aktivieren.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'trends', label: 'Trending Topics', icon: TrendingUp },
          { id: 'hooks',  label: 'Viral Hooks',     icon: Zap },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-brand-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── TRENDING TOPICS ── */}
      {activeTab === 'trends' && (
        <div className="space-y-4">
          {/* Controls */}
          {geminiService.isConfigured && (
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Branche / Thema</label>
                <input
                  type="text"
                  value={trendIndustry}
                  onChange={e => setTrendIndustry(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGenerateTrends()}
                  placeholder="z.B. E-Commerce, Fitness, B2B SaaS…"
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Plattform</label>
                <select value={trendPlatform} onChange={e => setTrendPlatform(e.target.value)} className="input text-sm w-auto">
                  <option value="all">Alle</option>
                  <option value="Instagram">Instagram</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Facebook">Facebook</option>
                </select>
              </div>
              <button
                onClick={handleGenerateTrends}
                disabled={loadingTrends}
                className="btn-primary disabled:opacity-50"
              >
                {loadingTrends ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loadingTrends ? 'Generiere…' : trends ? 'Neu generieren' : 'KI-Trends'}
              </button>
            </div>
          )}

          {trendError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{trendError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeTrends.map((topic) => {
              const PIcon = platformIconMap[topic.platform] || Compass
              return (
                <div key={topic.id} className="card p-4 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{topic.category}</span>
                    <PIcon className={`w-4 h-4 ${platformColorMap[topic.platform] || 'text-gray-500'}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-brand-600 transition-colors">
                    {topic.topic}
                  </h3>
                  {topic.description && (
                    <p className="text-xs text-gray-500 mb-2 leading-relaxed">{topic.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{(topic.volume || 0).toLocaleString('de-DE')} Mentions</span>
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      +{topic.growth}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── VIRAL HOOKS ── */}
      {activeTab === 'hooks' && (
        <div className="space-y-4">
          {/* AI Input */}
          {geminiService.isConfigured && (
            <div className="card p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                KI-Hooks generieren
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-48">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Thema *</label>
                  <input
                    type="text"
                    value={hookTopic}
                    onChange={e => setHookTopic(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGenerateHooks()}
                    placeholder="z.B. Produktlaunch, Employer Branding…"
                    className="input text-sm"
                  />
                </div>
                <div className="flex-1 min-w-40">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Branche</label>
                  <input
                    type="text"
                    value={hookIndustry}
                    onChange={e => setHookIndustry(e.target.value)}
                    placeholder="z.B. SaaS, Fashion, Fitness…"
                    className="input text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleGenerateHooks}
                    disabled={loadingHooks || !hookTopic.trim()}
                    className="btn-primary disabled:opacity-50"
                  >
                    {loadingHooks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loadingHooks ? 'Generiere…' : 'Hooks generieren'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {hookError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{hookError}</p>
            </div>
          )}

          {/* Formula filter */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {HOOK_FORMULAS.map(({ id, name, desc, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setFilterFormula(filterFormula === id ? 'all' : id)}
                className={`card p-3 text-left transition-all ${filterFormula === id ? 'ring-2 ring-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'hover:shadow-md'}`}
              >
                <Icon className={`w-5 h-5 mb-2 ${filterFormula === id ? 'text-brand-600' : 'text-gray-400'}`} />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>

          {/* Platform filter */}
          <div className="flex gap-3">
            <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className="input w-auto">
              <option value="all">Alle Plattformen</option>
              <option value="Instagram">Instagram</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="TikTok">TikTok</option>
            </select>
          </div>

          {/* Hooks list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredHooks.map((hook) => {
              const PIcon = platformIconMap[hook.platform] || Sparkles
              const hookText = hook.hook
              return (
                <div key={hook.id} className="card p-4 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <PIcon className={`w-4 h-4 ${platformColorMap[hook.platform] || 'text-gray-500'}`} />
                        <span className="badge bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 uppercase text-[10px]">
                          {hook.formula}
                        </span>
                        <span className="text-xs text-gray-400">{hook.category}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                        "{hookText}"
                      </p>
                    </div>
                    <button
                      onClick={() => copyHook(hookText, hook.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand-600 transition-colors shrink-0"
                      title="Kopieren"
                    >
                      {copiedId === hook.id
                        ? <span className="text-green-500 text-xs font-medium">✓</span>
                        : <Copy className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>
              )
            })}
            {filteredHooks.length === 0 && (
              <div className="col-span-2 text-center py-8 text-gray-400 text-sm">Keine Hooks für diese Filter</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
