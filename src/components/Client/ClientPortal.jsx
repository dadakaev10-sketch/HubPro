import { useMemo, useState } from 'react'
import {
  Clock, CheckCircle2, Rocket, AlertCircle,
  Instagram, Linkedin, Facebook, Video, Image,
  FileText, Eye, ChevronRight, MessageSquare, Calendar,
  ThumbsUp, RotateCcw, Sparkles, Link2
} from 'lucide-react'
import PostEditor from '../SocialMedia/PostEditor'
import ArticleEditor from '../SEO/ArticleEditor'
import { useAuth } from '../../contexts/AuthContext'

const STAGE_LABELS = {
  0: 'Content Dump',
  1: 'In Bearbeitung',
  2: 'Internes Review',
  3: 'Zur Freigabe',
  4: 'Freigegeben',
  5: 'Veröffentlicht',
}

const STAGE_COLORS = {
  0: 'bg-gray-400',
  1: 'bg-blue-500',
  2: 'bg-yellow-500',
  3: 'bg-purple-500',
  4: 'bg-green-500',
  5: 'bg-emerald-600',
}

const platformIcons = {
  Instagram, LinkedIn: Linkedin, Facebook, TikTok: Video,
}
const platformColors = {
  Instagram: 'text-pink-500',
  LinkedIn: 'text-blue-600',
  Facebook: 'text-blue-500',
  TikTok: 'text-gray-800 dark:text-white',
}

const articleStatusLabel = {
  draft: 'Entwurf',
  review: 'In Prüfung',
  approved: 'Freigegeben',
  published: 'Veröffentlicht',
}
const articleStatusColor = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export default function ClientPortal({ posts, articles, onUpdatePost, onUpdateArticle, clients = [] }) {
  const { user } = useAuth()
  const [selectedPost, setSelectedPost] = useState(null)
  const [showPostEditor, setShowPostEditor] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [showArticleEditor, setShowArticleEditor] = useState(false)

  // Wenn der User einem Kunden zugeordnet ist, nur dessen Inhalte zeigen
  const myPosts = useMemo(() => {
    if (!user?.clientName) return posts          // kein Filter → alle sichtbar
    return posts.filter(p => p.client === user.clientName)
  }, [posts, user?.clientName])

  const myArticles = useMemo(() => {
    if (!user?.clientName) return articles
    return articles.filter(a => a.client === user.clientName || !a.client)
  }, [articles, user?.clientName])

  // Computed stats
  const stats = useMemo(() => ({
    pendingApproval: myPosts.filter(p => p.stage === 3).length,
    inProgress:      myPosts.filter(p => p.stage === 1 || p.stage === 2).length,
    approved:        myPosts.filter(p => p.stage === 4).length,
    published:       myPosts.filter(p => p.stage === 5).length,
    articlesReview:  myArticles.filter(a => a.status === 'review').length,
    articlesLive:    myArticles.filter(a => a.status === 'published').length,
  }), [myPosts, myArticles])

  // Posts grouped by status
  const pendingPosts  = useMemo(() => myPosts.filter(p => p.stage === 3), [myPosts])
  const inWorkPosts   = useMemo(() => myPosts.filter(p => p.stage === 1 || p.stage === 2), [myPosts])
  const donePosts     = useMemo(() => myPosts.filter(p => p.stage === 4 || p.stage === 5)
    .sort((a, b) => (b.stage - a.stage)), [myPosts])

  const recentArticles = useMemo(() =>
    [...myArticles].sort((a, b) => {
      const order = { review: 0, approved: 1, published: 2, draft: 3 }
      return (order[a.status] ?? 3) - (order[b.status] ?? 3)
    }).slice(0, 6),
  [myArticles])

  function openPost(post) {
    setSelectedPost(post)
    setShowPostEditor(true)
  }

  function openArticle(article) {
    setSelectedArticle(article)
    setShowArticleEditor(true)
  }

  return (
    <div className="space-y-8">

      {/* ── Begrüßung ────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mein Portal</h2>
            <p className="text-sm text-gray-500">Übersicht über alle Inhalte und anstehende Freigaben</p>
          </div>
        </div>
        {user?.clientName && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 rounded-lg shrink-0">
            <Link2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span className="text-sm font-medium text-brand-700 dark:text-brand-400">{user.clientName}</span>
          </div>
        )}
      </div>

      {/* ── Stat-Karten ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertCircle}
          iconColor="text-purple-600"
          bgColor="bg-purple-50 dark:bg-purple-900/20"
          label="Warten auf Freigabe"
          value={stats.pendingApproval}
          highlight={stats.pendingApproval > 0}
        />
        <StatCard
          icon={Clock}
          iconColor="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
          label="In Bearbeitung"
          value={stats.inProgress}
        />
        <StatCard
          icon={CheckCircle2}
          iconColor="text-green-600"
          bgColor="bg-green-50 dark:bg-green-900/20"
          label="Freigegeben"
          value={stats.approved}
        />
        <StatCard
          icon={Rocket}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50 dark:bg-emerald-900/20"
          label="Veröffentlicht"
          value={stats.published}
        />
      </div>

      {/* ── Zur Freigabe (Aktion erforderlich) ────────────────── */}
      <Section
        title="Zur Freigabe"
        badge={pendingPosts.length}
        badgeColor="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
        subtitle={pendingPosts.length > 0 ? 'Diese Posts warten auf deine Freigabe' : 'Keine Posts zur Freigabe'}
        dot="bg-purple-500"
      >
        {pendingPosts.length === 0 ? (
          <EmptyState icon={CheckCircle2} text="Alles erledigt – keine offenen Freigaben" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onOpen={openPost}
                showApproveButton
                onApprove={(e) => {
                  e.stopPropagation()
                  onUpdatePost({ ...post, stage: 4, status: 'approved' })
                }}
                onRevision={(e) => {
                  e.stopPropagation()
                  onUpdatePost({ ...post, status: 'revision_needed' })
                }}
              />
            ))}
          </div>
        )}
      </Section>

      {/* ── In Bearbeitung ───────────────────────────────────── */}
      {inWorkPosts.length > 0 && (
        <Section
          title="In Bearbeitung"
          badge={inWorkPosts.length}
          badgeColor="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          subtitle="Unsere Agentur arbeitet aktuell daran"
          dot="bg-blue-500"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inWorkPosts.map(post => (
              <PostCard key={post.id} post={post} onOpen={openPost} readOnly />
            ))}
          </div>
        </Section>
      )}

      {/* ── Erledigt / Veröffentlicht ────────────────────────── */}
      {donePosts.length > 0 && (
        <Section
          title="Freigegeben & Live"
          badge={donePosts.length}
          badgeColor="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          subtitle="Bereits veröffentlichte oder freigegebene Posts"
          dot="bg-emerald-500"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {donePosts.slice(0, 6).map(post => (
              <PostCard key={post.id} post={post} onOpen={openPost} readOnly />
            ))}
          </div>
        </Section>
      )}

      {/* ── SEO Artikel ──────────────────────────────────────── */}
      {recentArticles.length > 0 && (
        <Section
          title="SEO Artikel"
          badge={articles.length}
          badgeColor="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
          subtitle="Aktuelle Artikel und deren Status"
          dot="bg-brand-500"
        >
          <div className="space-y-2">
            {recentArticles.map(article => (
              <div
                key={article.id}
                onClick={() => openArticle(article)}
                className="card px-4 py-3 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{article.title}</p>
                  <p className="text-xs text-gray-400 truncate">{article.keywords?.slice(0, 3).join(', ')}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {article.score != null && (
                    <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 hidden sm:block">
                      SEO {article.score}
                    </span>
                  )}
                  <span className={`badge text-xs ${articleStatusColor[article.status] || articleStatusColor.draft}`}>
                    {articleStatusLabel[article.status] || article.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Modals ───────────────────────────────────────────── */}
      {showPostEditor && (
        <PostEditor
          post={selectedPost}
          onClose={() => { setShowPostEditor(false); setSelectedPost(null) }}
          onSave={(post) => { onUpdatePost(post); setShowPostEditor(false); setSelectedPost(null) }}
          isClient={true}
          clients={clients}
        />
      )}
      {showArticleEditor && selectedArticle && (
        <ArticleEditor
          article={selectedArticle}
          onClose={() => { setShowArticleEditor(false); setSelectedArticle(null) }}
          onSave={(a) => { onUpdateArticle(a); setShowArticleEditor(false); setSelectedArticle(null) }}
          isClient={true}
          clients={clients}
        />
      )}
    </div>
  )
}

// ── Hilfskomponenten ─────────────────────────────────────────────────────────

function StatCard({ icon: Icon, iconColor, bgColor, label, value, highlight }) {
  return (
    <div className={`card px-5 py-4 flex items-center gap-4 ${highlight ? 'ring-2 ring-purple-400 dark:ring-purple-600' : ''}`}>
      <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 leading-snug">{label}</p>
      </div>
    </div>
  )
}

function Section({ title, badge, badgeColor, subtitle, dot, children }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {badge != null && (
          <span className={`badge text-xs font-semibold ${badgeColor}`}>{badge}</span>
        )}
        {subtitle && (
          <p className="text-sm text-gray-400 hidden sm:block">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="card px-6 py-10 text-center text-gray-400">
      <Icon className="w-8 h-8 mx-auto mb-2 opacity-40" />
      <p className="text-sm">{text}</p>
    </div>
  )
}

function PostCard({ post, onOpen, showApproveButton, onApprove, onRevision, readOnly }) {
  const PlatformIcon = platformIcons[post.platform] || Image
  const stageLabel   = STAGE_LABELS[post.stage] ?? ''
  const stageDot     = STAGE_COLORS[post.stage] ?? 'bg-gray-400'

  return (
    <div
      onClick={() => !readOnly && onOpen(post)}
      className={`card p-4 space-y-3 transition-all ${!readOnly ? 'cursor-pointer hover:shadow-md' : 'opacity-80'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <PlatformIcon className={`w-4 h-4 ${platformColors[post.platform]}`} />
          <span className="text-xs font-medium text-gray-500">{post.platform}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${stageDot}`} />
          <span className="text-xs text-gray-400">{stageLabel}</span>
        </div>
      </div>

      {/* Title + Content */}
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-1 mb-1">{post.title}</p>
        <p className="text-xs text-gray-500 line-clamp-2">{post.content}</p>
      </div>

      {/* Footer info */}
      <div className="flex items-center gap-3 text-xs text-gray-400">
        {post.scheduledDate && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(post.scheduledDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
          </span>
        )}
        {post.comments?.length > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {post.comments.length}
          </span>
        )}
        {!showApproveButton && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(post) }}
            className="ml-auto flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline"
          >
            <Eye className="w-3 h-3" /> Ansehen
          </button>
        )}
      </div>

      {/* Freigabe-Buttons nur bei Stage 3 */}
      {showApproveButton && (
        <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onRevision}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Korrektur
          </button>
          <button
            onClick={onApprove}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            Freigeben
          </button>
        </div>
      )}
    </div>
  )
}
