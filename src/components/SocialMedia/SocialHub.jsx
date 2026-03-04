import { useState, useMemo } from 'react'
import { Plus, Filter, Search, Instagram, Linkedin, Facebook, Video, GripVertical, MessageSquare, Calendar, Eye, MoreHorizontal, ChevronRight, Image } from 'lucide-react'
import PostEditor from './PostEditor'
import { useAuth } from '../../contexts/AuthContext'

const STAGES = [
  { id: 0, label: 'Content Dump', color: 'bg-gray-400', lightBg: 'bg-gray-50 dark:bg-gray-800/50' },
  { id: 1, label: 'In Bearbeitung', color: 'bg-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 2, label: 'Internes Review', color: 'bg-yellow-500', lightBg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { id: 3, label: 'Approval', color: 'bg-purple-500', lightBg: 'bg-purple-50 dark:bg-purple-900/20' },
  { id: 4, label: 'Freigegeben', color: 'bg-green-500', lightBg: 'bg-green-50 dark:bg-green-900/20' },
  { id: 5, label: 'Published', color: 'bg-emerald-600', lightBg: 'bg-emerald-50 dark:bg-emerald-900/20' },
]

const platformIcons = {
  Instagram: Instagram,
  LinkedIn: Linkedin,
  Facebook: Facebook,
  TikTok: Video,
}

const platformColors = {
  Instagram: 'text-pink-500',
  LinkedIn: 'text-blue-600',
  Facebook: 'text-blue-500',
  TikTok: 'text-gray-900 dark:text-white',
}

export default function SocialHub({ posts, onUpdatePost, isClient, clients = [], clientName = null }) {
  const { user, isAdmin } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [selectedPost, setSelectedPost] = useState(null)
  const [showEditor, setShowEditor] = useState(false)
  const [draggedPost, setDraggedPost] = useState(null)

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPlatform = filterPlatform === 'all' || post.platform === filterPlatform
      // Clients sehen alle Stages außer Stage 0 (Content Dump – interne Ideensammlung)
      const matchesRole = !isClient || post.stage >= 1
      // Wenn der Kunde einer Firma zugeordnet ist, nur deren Posts zeigen
      const matchesClient = !isClient || !clientName || post.client === clientName
      // Admin sieht alles, Agentur nur eigene Posts, Kunden gefiltert nach Firma
      const matchesCreator = isAdmin || isClient || post.createdBy === user?.id
      return matchesSearch && matchesPlatform && matchesRole && matchesClient && matchesCreator
    })
  }, [posts, searchTerm, filterPlatform, isClient, clientName, isAdmin, user?.id])

  const postsByStage = useMemo(() => {
    // Kunden sehen Stages 1-5 (kein interner Content Dump)
    const stages = isClient ? STAGES.filter(s => s.id >= 1) : STAGES
    return stages.map(stage => ({
      ...stage,
      posts: filteredPosts.filter(p => p.stage === stage.id),
    }))
  }, [filteredPosts, isClient])

  const handleDragStart = (post) => setDraggedPost(post)
  const handleDragOver = (e) => e.preventDefault()
  const handleDrop = (stageId) => {
    if (draggedPost && draggedPost.stage !== stageId) {
      onUpdatePost({ ...draggedPost, stage: stageId })
    }
    setDraggedPost(null)
  }

  const handleNewPost = () => {
    setSelectedPost(null)
    setShowEditor(true)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Posts durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9 w-64"
            />
          </div>
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="input w-auto"
          >
            <option value="all">Alle Plattformen</option>
            <option value="Instagram">Instagram</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Facebook">Facebook</option>
            <option value="TikTok">TikTok</option>
          </select>
        </div>
        {!isClient && (
          <button onClick={handleNewPost} className="btn-primary">
            <Plus className="w-4 h-4" />
            Neuer Post
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {postsByStage.map((stage) => (
          <div
            key={stage.id}
            className={`flex-shrink-0 w-72 rounded-xl ${stage.lightBg} border border-gray-200 dark:border-gray-700`}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage.id)}
          >
            {/* Stage header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{stage.label}</h3>
                  {isClient && stage.id === 3 && stage.posts.length > 0 && (
                    <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] font-semibold animate-pulse">
                      Aktion
                    </span>
                  )}
                </div>
                <span className="badge bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {stage.posts.length}
                </span>
              </div>
            </div>

            {/* Posts */}
            <div className="p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
              {stage.posts.map((post) => {
                const PlatformIcon = platformIcons[post.platform] || Image
                return (
                  <div
                    key={post.id}
                    draggable={!isClient}
                    onDragStart={() => handleDragStart(post)}
                    onClick={() => { setSelectedPost(post); setShowEditor(true) }}
                    className="card p-3 cursor-pointer hover:shadow-md transition-all group"
                  >
                    {/* Platform + Client */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <PlatformIcon className={`w-4 h-4 ${platformColors[post.platform]}`} />
                        <span className="text-xs font-medium text-gray-500">{post.platform}</span>
                      </div>
                      {post.client && (
                        <span className="text-xs text-gray-400">{post.client}</span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 line-clamp-2">
                      {post.title}
                    </h4>

                    {/* Content preview */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                      {post.content}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
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
                      </div>
                      {post.assignee && (
                        <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-[10px] font-medium text-brand-700 dark:text-brand-400">
                          {post.assignee.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {stage.posts.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Keine Posts
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Post Editor Modal */}
      {showEditor && (
        <PostEditor
          post={selectedPost}
          onClose={() => { setShowEditor(false); setSelectedPost(null) }}
          onSave={(post) => { onUpdatePost(post); setShowEditor(false); setSelectedPost(null) }}
          isClient={isClient}
          clients={clients}
          currentUser={user}
        />
      )}
    </div>
  )
}
