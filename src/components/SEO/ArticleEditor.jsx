import { useState, useMemo } from 'react'
import { X, Save, Eye, Type, Hash, Globe, Link, BarChart3, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'
import { calculateSEOScore, getScoreColor, getScoreLabel, getScoreRingColor } from '../../utils/seoScoring'
import { wordpressService } from '../../services/wordpress'

export default function ArticleEditor({ article, onClose, onSave, isClient, clients = [] }) {
  const isNew = !article
  const [form, setForm] = useState({
    id: article?.id || `art_${Date.now()}`,
    title: article?.title || '',
    slug: article?.slug || '',
    keywords: article?.keywords || [],
    score: article?.score || 0,
    status: article?.status || 'draft',
    metaData: article?.metaData || { m_title: '', m_desc: '' },
    htmlContent: article?.htmlContent || '',
    wordCount: article?.wordCount || 0,
    author: article?.author || 'Agentur',
    client: article?.client || '',
    lastModified: new Date().toISOString(),
    readingTime: article?.readingTime || 0,
    wpPostId: article?.wpPostId || null,
    wpPostUrl: article?.wpPostUrl || '',
  })
  const [keywordInput, setKeywordInput] = useState('')
  const [activeTab, setActiveTab] = useState('editor')
  const [wpPublishing, setWpPublishing] = useState(false)
  const [wpError, setWpError] = useState('')

  const update = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Auto-generate slug from title
      if (field === 'title') {
        next.slug = value.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-').replace(/(^-|-$)/g, '')
      }
      // Auto-calculate word count
      if (field === 'htmlContent') {
        const text = value.replace(/<[^>]*>/g, '')
        next.wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
        next.readingTime = Math.ceil(next.wordCount / 200)
      }
      return next
    })
  }

  const updateMeta = (field, value) => {
    setForm(prev => ({ ...prev, metaData: { ...prev.metaData, [field]: value } }))
  }

  const addKeyword = () => {
    if (keywordInput.trim() && !form.keywords.includes(keywordInput.trim())) {
      update('keywords', [...form.keywords, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const removeKeyword = (kw) => {
    update('keywords', form.keywords.filter(k => k !== kw))
  }

  // Calculate SEO score
  const seoResult = useMemo(() => {
    return calculateSEOScore({
      title: form.title,
      content: form.htmlContent,
      keyword: form.keywords[0] || '',
      metaTitle: form.metaData.m_title,
      metaDescription: form.metaData.m_desc,
      wordCount: form.wordCount,
    })
  }, [form.title, form.htmlContent, form.keywords, form.metaData, form.wordCount])

  const handleSave = () => {
    onSave({ ...form, score: seoResult.score })
  }

  const selectedClient = clients.find(c => c.company === form.client) || null
  const wpAvailable = wordpressService.isConfigured || wordpressService.isConfiguredForClient(selectedClient)

  const handlePublishToWordPress = async () => {
    setWpPublishing(true)
    setWpError('')
    try {
      const result = await wordpressService.publishPost({ ...form, score: seoResult.score }, selectedClient)
      const updated = { ...form, score: seoResult.score, wpPostId: result.wpPostId, wpPostUrl: result.wpPostUrl }
      setForm(prev => ({ ...prev, wpPostId: result.wpPostId, wpPostUrl: result.wpPostUrl }))
      onSave(updated)
    } catch (err) {
      setWpError(err.message)
    }
    setWpPublishing(false)
  }

  const circumference = 2 * Math.PI * 40
  const strokeOffset = circumference - (seoResult.score / 100) * circumference

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isNew ? 'Neuer Artikel' : form.title || 'Artikel bearbeiten'}
            </h2>
            {form.slug && <p className="text-xs text-gray-500 mt-0.5">/{form.slug}</p>}
          </div>
          <div className="flex items-center gap-3">
            {/* Score badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${seoResult.score >= 60 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-orange-100 dark:bg-orange-900/20'}`}>
              <BarChart3 className={`w-4 h-4 ${getScoreColor(seoResult.score)}`} />
              <span className={`text-sm font-bold ${getScoreColor(seoResult.score)}`}>{seoResult.score}/100</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          {[
            { id: 'editor', label: 'Editor', icon: Type },
            { id: 'seo', label: 'SEO-Analyse', icon: BarChart3 },
            { id: 'meta', label: 'Meta-Daten', icon: Globe },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            {/* Main content area */}
            <div className="flex-1 p-6">
              {activeTab === 'editor' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titel (H1)</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => update('title', e.target.value)}
                        className="input text-lg font-semibold"
                        placeholder="Der Titel deines Artikels"
                        disabled={isClient}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kunde</label>
                      <select
                        value={form.client}
                        onChange={(e) => update('client', e.target.value)}
                        className="input"
                        disabled={isClient}
                      >
                        <option value="">— kein Kunde —</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.company}>{c.company}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fokus-Keywords</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.keywords.map((kw) => (
                        <span key={kw} className="badge bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 pr-1 flex items-center gap-1">
                          {kw}
                          {!isClient && (
                            <button onClick={() => removeKeyword(kw)} className="hover:text-red-500 ml-1">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {!isClient && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                          className="input flex-1"
                          placeholder="Keyword hinzufügen..."
                        />
                        <button onClick={addKeyword} className="btn-secondary">
                          <Hash className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Inhalt</label>
                      <span className="text-xs text-gray-500">{form.wordCount} Wörter &middot; {form.readingTime} min Lesezeit</span>
                    </div>
                    <textarea
                      value={form.htmlContent}
                      onChange={(e) => update('htmlContent', e.target.value)}
                      rows={16}
                      className="input resize-none font-mono text-sm"
                      placeholder="Schreibe deinen Artikel... (HTML wird unterstützt)"
                      disabled={isClient}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'seo' && (
                <div className="space-y-6">
                  {/* Score ring */}
                  <div className="flex items-center gap-8">
                    <div className="relative w-28 h-28">
                      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke={getScoreRingColor(seoResult.score)}
                          strokeWidth="8"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeOffset}
                          strokeLinecap="round"
                          className="transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-bold ${getScoreColor(seoResult.score)}`}>{seoResult.score}</span>
                        <span className="text-xs text-gray-500">von 100</span>
                      </div>
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${getScoreColor(seoResult.score)}`}>{getScoreLabel(seoResult.score)}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {seoResult.score >= 80 ? 'Dein Artikel ist hervorragend optimiert.' :
                         seoResult.score >= 60 ? 'Guter Ansatz, aber es gibt Verbesserungspotenzial.' :
                         'Es gibt mehrere Bereiche, die optimiert werden sollten.'}
                      </p>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Detailanalyse</h4>
                    {seoResult.breakdown.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                        {item.passed ? (
                          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{item.label}</p>
                        </div>
                        <span className={`text-sm font-bold ${item.passed ? 'text-green-600' : 'text-orange-600'}`}>
                          {item.points}/{item.maxPoints}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'meta' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Meta-Titel
                      <span className="text-gray-400 font-normal ml-2">{form.metaData.m_title.length}/60 Zeichen</span>
                    </label>
                    <input
                      type="text"
                      value={form.metaData.m_title}
                      onChange={(e) => updateMeta('m_title', e.target.value)}
                      className="input"
                      maxLength={60}
                      placeholder="SEO-Titel für Google"
                      disabled={isClient}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Meta-Description
                      <span className="text-gray-400 font-normal ml-2">{form.metaData.m_desc.length}/160 Zeichen</span>
                    </label>
                    <textarea
                      value={form.metaData.m_desc}
                      onChange={(e) => updateMeta('m_desc', e.target.value)}
                      className="input resize-none"
                      rows={3}
                      maxLength={160}
                      placeholder="Beschreibung für die Google-Suche (120-160 Zeichen optimal)"
                      disabled={isClient}
                    />
                  </div>

                  {/* Google Preview */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Google Vorschau</h4>
                    <div className="card p-4 bg-white dark:bg-gray-900 max-w-xl">
                      <p className="text-blue-700 dark:text-blue-400 text-lg hover:underline cursor-pointer truncate">
                        {form.metaData.m_title || form.title || 'Seitentitel'}
                      </p>
                      <p className="text-green-700 dark:text-green-500 text-sm mt-0.5 truncate">
                        www.beispiel.de/{form.slug || 'seite'}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                        {form.metaData.m_desc || 'Keine Meta-Description vorhanden. Google wird automatisch einen Auszug aus dem Seiteninhalt generieren.'}
                      </p>
                    </div>
                  </div>

                  {/* URL slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL-Slug</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">www.beispiel.de/</span>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => update('slug', e.target.value)}
                        className="input flex-1"
                        disabled={isClient}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="btn-secondary">
              {isClient ? 'Schliessen' : 'Abbrechen'}
            </button>
            {form.wpPostUrl && (
              <a
                href={form.wpPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                WordPress Post ansehen
              </a>
            )}
            {wpError && (
              <span className="text-xs text-red-500">{wpError}</span>
            )}
          </div>
          {!isClient && (
            <div className="flex gap-2">
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                className="input w-auto"
              >
                <option value="draft">Entwurf</option>
                <option value="review">Review</option>
                <option value="approved">Freigegeben</option>
                <option value="published">Veröffentlicht</option>
              </select>
              {wpAvailable && (
                <button
                  onClick={handlePublishToWordPress}
                  disabled={wpPublishing}
                  className="btn-secondary disabled:opacity-50"
                >
                  {wpPublishing ? (
                    <span className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-500 rounded-full animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  {form.wpPostId ? 'WP aktualisieren' : 'Zu WordPress'}
                </button>
              )}
              <button onClick={handleSave} className="btn-primary">
                <Save className="w-4 h-4" />
                Speichern
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
