import { useState } from 'react'
import { X, Sparkles, AlertCircle, ChevronRight } from 'lucide-react'
import { geminiService } from '../../services/gemini'

const CONTENT_TYPES = ['Blog Artikel', 'Landingpage', 'Produktbeschreibung', 'Ratgeber']
const TONALITIES    = ['Professionell', 'Locker', 'Persuasiv', 'Informativ']

const LOADING_STEPS = [
  'Keyword analysieren…',
  'Struktur planen…',
  'Artikel verfassen…',
  'SEO optimieren…',
]

export default function AIContentGenerator({ onClose, onGenerated }) {
  const [keyword,       setKeyword]       = useState('')
  const [contentType,   setContentType]   = useState('Blog Artikel')
  const [tonality,      setTonality]      = useState('Professionell')
  const [wordCount,     setWordCount]     = useState(1200)
  const [focusKeywords, setFocusKeywords] = useState('')
  const [language,      setLanguage]      = useState('de')
  const [loading,       setLoading]       = useState(false)
  const [loadStep,      setLoadStep]      = useState(0)
  const [error,         setError]         = useState('')

  async function handleGenerate(e) {
    e.preventDefault()
    if (!keyword.trim()) return
    setLoading(true)
    setError('')
    setLoadStep(0)

    // Animated step progress
    const intervals = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setLoadStep(i), i * 900)
    )

    try {
      const result = await geminiService.generateSEOContent({
        keyword:       keyword.trim(),
        contentType,
        tonality,
        wordCount,
        focusKeywords,
        language,
      })
      intervals.forEach(clearTimeout)
      onGenerated(result)
    } catch (err) {
      intervals.forEach(clearTimeout)
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">KI-Artikel Generator</h3>
              <p className="text-xs text-gray-500">Gemini AI · SEO-optimierter Content</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-40">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="w-full max-w-xs space-y-2">
              {LOADING_STEPS.map((step, i) => (
                <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i <= loadStep ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    i < loadStep ? 'bg-green-500' : i === loadStep ? 'bg-brand-500 animate-pulse' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    {i < loadStep ? (
                      <span className="text-white text-[10px]">✓</span>
                    ) : i === loadStep ? (
                      <span className="w-2 h-2 bg-white rounded-full" />
                    ) : null}
                  </div>
                  <span className={`text-sm ${i === loadStep ? 'text-brand-600 font-medium' : 'text-gray-500'}`}>{step}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center">Gemini generiert deinen Artikel…<br/>Das dauert ca. 15–30 Sekunden.</p>
          </div>
        )}

        {/* Form */}
        {!loading && (
          <form onSubmit={handleGenerate} className="p-6 space-y-4 overflow-y-auto">
            {!geminiService.isConfigured && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">VITE_GEMINI_API_KEY in .env eintragen, damit die KI funktioniert.</p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Keyword */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Haupt-Keyword / Thema *</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="input"
                placeholder="z.B. SEO-Strategie für Startups"
                required
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sprache</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 w-fit">
                {[{ val: 'de', label: '🇩🇪 Deutsch' }, { val: 'en', label: '🇬🇧 English' }].map(({ val, label }) => (
                  <button
                    key={val} type="button"
                    onClick={() => setLanguage(val)}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                      language === val ? 'bg-brand-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >{label}</button>
                ))}
              </div>
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content-Typ</label>
              <div className="grid grid-cols-2 gap-2">
                {CONTENT_TYPES.map(ct => (
                  <button
                    key={ct} type="button"
                    onClick={() => setContentType(ct)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors text-left ${
                      contentType === ct
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >{ct}</button>
                ))}
              </div>
            </div>

            {/* Tonality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tonalität</label>
              <div className="flex flex-wrap gap-2">
                {TONALITIES.map(t => (
                  <button
                    key={t} type="button"
                    onClick={() => setTonality(t)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      tonality === t
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >{t}</button>
                ))}
              </div>
            </div>

            {/* Word Count */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Wortanzahl</label>
                <span className="text-sm font-semibold text-brand-600">{wordCount.toLocaleString('de-DE')}</span>
              </div>
              <input
                type="range" min={500} max={2000} step={100}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>500</span><span>2.000</span>
              </div>
            </div>

            {/* Focus Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weitere Keywords <span className="text-gray-400 font-normal">(optional, eine pro Zeile)</span></label>
              <textarea
                value={focusKeywords}
                onChange={(e) => setFocusKeywords(e.target.value)}
                rows={2}
                className="input resize-none text-sm"
                placeholder="keyword-1&#10;keyword-2"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!keyword.trim() || !geminiService.isConfigured}
              className="btn-primary w-full justify-center py-2.5 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              Artikel generieren
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
