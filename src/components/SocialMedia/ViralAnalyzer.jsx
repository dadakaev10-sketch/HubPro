import { useState, useRef } from 'react'
import { X, Upload, Zap, CheckCircle, AlertCircle, Copy, ChevronDown, ChevronUp, Image } from 'lucide-react'
import { geminiService } from '../../services/gemini'

const CATEGORIES = ['Fashion', 'Food', 'Lifestyle', 'Fitness', 'Travel', 'Business', 'Beauty', 'Tech', 'Entertainment']

function ScoreRing({ score, size = 80 }) {
  const r = size * 0.38
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={size*0.08} className="text-gray-200 dark:text-gray-700" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={size*0.08}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={size*0.22} fontWeight="bold" fill={color}>{score}</text>
    </svg>
  )
}

function ScoreBar({ label, value }) {
  const color = value >= 75 ? 'bg-green-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">{value}</span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function ViralAnalyzer({ platform, onClose, onUseCaption }) {
  const fileRef = useRef(null)
  const [image, setImage] = useState(null)       // { base64, mimeType, previewUrl }
  const [category, setCategory] = useState('Lifestyle')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showHashtags, setShowHashtags] = useState(false)
  const [copied, setCopied] = useState('')
  const [dragging, setDragging] = useState(false)

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      const base64 = dataUrl.split(',')[1]
      setImage({ base64, mimeType: file.type, previewUrl: dataUrl })
      setResult(null)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  async function handleAnalyze() {
    if (!image) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await geminiService.analyzeViralPotential({
        imageBase64: image.base64,
        mimeType: image.mimeType,
        platform,
        category,
      })
      setResult(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Viral-Analyse</h3>
              <p className="text-xs text-gray-500">Gemini AI · {platform}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Upload + Config */}
          <div className="grid grid-cols-2 gap-4">
            {/* Image drop zone */}
            <div
              className={`col-span-2 sm:col-span-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
                dragging ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
              }`}
              style={{ minHeight: 140 }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
            >
              {image ? (
                <img src={image.previewUrl} alt="preview" className="h-32 w-full object-cover rounded-lg" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Bild hochladen</p>
                  <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            </div>

            {/* Config */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Kategorie</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input text-sm">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Plattform</label>
                <input value={platform} disabled className="input text-sm bg-gray-50 dark:bg-gray-700/50" />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={!image || loading || !geminiService.isConfigured}
                className="btn-primary w-full justify-center disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {loading ? 'Analysiere…' : 'Jetzt analysieren'}
              </button>
              {!geminiService.isConfigured && (
                <p className="text-xs text-amber-600 dark:text-amber-400">VITE_GEMINI_API_KEY in .env eintragen</p>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Viral Score */}
              <div className="card p-4 flex items-center gap-5">
                <ScoreRing score={result.viralScore} size={72} />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {result.viralScore >= 75 ? '🔥 Hohes Viral-Potenzial' : result.viralScore >= 50 ? '⚡ Mittleres Potenzial' : '📉 Geringes Potenzial'}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{result.imageContent}</p>
                  <p className="text-xs text-gray-400 mt-1">📅 {result.bestPostingTime} · 📈 {result.trendWindow}</p>
                </div>
              </div>

              {/* Category Scores */}
              <div className="card p-4 space-y-2.5">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Bewertung</p>
                <ScoreBar label="Bildqualität" value={result.scores?.bildqualitaet || 0} />
                <ScoreBar label="Hook-Faktor" value={result.scores?.hookFaktor || 0} />
                <ScoreBar label="Trend-Relevanz" value={result.scores?.trendRelevanz || 0} />
                <ScoreBar label="Engagement-Potenzial" value={result.scores?.engagementPotenzial || 0} />
              </div>

              {/* Gut / Verbessern */}
              <div className="grid grid-cols-2 gap-3">
                <div className="card p-3">
                  <p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Stärken</p>
                  <ul className="space-y-1">
                    {(result.wasGutIst || []).map((t, i) => <li key={i} className="text-xs text-gray-600 dark:text-gray-400">• {t}</li>)}
                  </ul>
                </div>
                <div className="card p-3">
                  <p className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Verbesserungen</p>
                  <ul className="space-y-1">
                    {(result.wasVerbessern || []).map((t, i) => <li key={i} className="text-xs text-gray-600 dark:text-gray-400">• {t}</li>)}
                  </ul>
                </div>
              </div>

              {/* Captions */}
              <div className="card p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Captions — klicken zum Übernehmen</p>
                <div className="space-y-2">
                  {[
                    { key: 'locker', label: 'Locker' },
                    { key: 'storytelling', label: 'Storytelling' },
                    { key: 'cta', label: 'Call-to-Action' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-start gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-400 cursor-pointer transition-colors group"
                      onClick={() => onUseCaption(result.captions[key])}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-brand-600 font-semibold mb-0.5">{label}</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{result.captions[key]}</p>
                      </div>
                      <button className="shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); copyText(result.captions[key], key) }}>
                        {copied === key ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hashtags */}
              <div className="card p-4">
                <button className="flex items-center justify-between w-full" onClick={() => setShowHashtags(p => !p)}>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Hashtags ({Object.values(result.hashtags || {}).flat().length})</p>
                  {showHashtags ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showHashtags && (
                  <div className="mt-3 space-y-3">
                    {[
                      { key: 'trending', label: 'Trending', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
                      { key: 'nische',   label: 'Nische',   color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' },
                      { key: 'micro',    label: 'Micro',    color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
                    ].map(({ key, label, color }) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-medium text-gray-500">{label}</p>
                          <button className="text-xs text-brand-600 hover:underline"
                            onClick={() => copyText((result.hashtags[key] || []).join(' '), `ht-${key}`)}>
                            {copied === `ht-${key}` ? '✓ Kopiert' : 'Alle kopieren'}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(result.hashtags[key] || []).map((ht, i) => (
                            <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer ${color}`}
                              onClick={() => copyText(ht, `${key}-${i}`)}>
                              {ht}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
