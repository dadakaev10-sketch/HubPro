import { useState, useMemo } from 'react'
import { Plus, Search, FileText, Calendar, User, TrendingUp, Eye, Edit3, Trash2, ExternalLink } from 'lucide-react'
import { getScoreColor, getScoreLabel, getScoreBgColor } from '../../utils/seoScoring'
import ArticleEditor from './ArticleEditor'

export default function SEOHub({ articles, onUpdateArticle, isClient, clients = [] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [showEditor, setShowEditor] = useState(false)

  const filtered = useMemo(() => {
    return articles.filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.keywords?.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = filterStatus === 'all' || a.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [articles, searchTerm, filterStatus])

  const stats = useMemo(() => ({
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    avgScore: Math.round(articles.reduce((s, a) => s + (a.score || 0), 0) / (articles.length || 1)),
    inReview: articles.filter(a => a.status === 'review').length,
  }), [articles])

  const handleNew = () => {
    setSelectedArticle(null)
    setShowEditor(true)
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Gesamt', value: stats.total, icon: FileText, color: 'text-gray-600' },
          { label: 'Veröffentlicht', value: stats.published, icon: ExternalLink, color: 'text-green-600' },
          { label: 'Im Review', value: stats.inReview, icon: Eye, color: 'text-yellow-600' },
          { label: 'Avg. SEO-Score', value: stats.avgScore, icon: TrendingUp, color: getScoreColor(stats.avgScore) },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Artikel oder Keywords suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9 w-72"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input w-auto"
          >
            <option value="all">Alle Status</option>
            <option value="draft">Entwurf</option>
            <option value="review">Review</option>
            <option value="approved">Freigegeben</option>
            <option value="published">Veröffentlicht</option>
          </select>
        </div>
        {!isClient && (
          <button onClick={handleNew} className="btn-primary">
            <Plus className="w-4 h-4" />
            Artikel erstellen
          </button>
        )}
      </div>

      {/* Articles table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Artikel</th>
              <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 py-3 hidden md:table-cell">Keywords</th>
              <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 py-3">SEO-Score</th>
              <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 py-3 hidden sm:table-cell">Status</th>
              <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 py-3">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {filtered.map((article) => {
              const statusStyles = {
                draft: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                review: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
                approved: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
                published: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
              }
              const statusLabels = { draft: 'Entwurf', review: 'Review', approved: 'Freigegeben', published: 'Veröffentlicht' }

              return (
                <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{article.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">/{article.slug} &middot; {article.wordCount} Wörter</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {article.keywords?.slice(0, 3).map((kw) => (
                        <span key={kw} className="badge bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400">{kw}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className={`text-lg font-bold ${getScoreColor(article.score)}`}>{article.score}</span>
                      <span className={`text-[10px] ${getScoreColor(article.score)}`}>{getScoreLabel(article.score)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className={`badge ${statusStyles[article.status]}`}>
                      {statusLabels[article.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { setSelectedArticle(article); setShowEditor(true) }}
                      className="btn-secondary text-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {isClient ? 'Ansehen' : 'Bearbeiten'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Keine Artikel gefunden</p>
          </div>
        )}
      </div>

      {/* Article Editor Modal */}
      {showEditor && (
        <ArticleEditor
          article={selectedArticle}
          onClose={() => { setShowEditor(false); setSelectedArticle(null) }}
          onSave={(article) => { onUpdateArticle(article); setShowEditor(false); setSelectedArticle(null) }}
          isClient={isClient}
          clients={clients}
        />
      )}
    </div>
  )
}
