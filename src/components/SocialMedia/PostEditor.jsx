import { useState, useRef } from 'react'
import { X, Instagram, Linkedin, Facebook, Video, Send, MessageSquare, Clock, Image, Trash2, Zap, Upload } from 'lucide-react'
import ViralAnalyzer from './ViralAnalyzer'

const STAGES = ['Content Dump', 'In Bearbeitung', 'Internes Review', 'Approval', 'Freigegeben', 'Published']

export default function PostEditor({ post, onClose, onSave, isClient, clients = [], currentUser = null }) {
  const isNew = !post
  const [form, setForm] = useState({
    id: post?.id || `post_${Date.now()}`,
    title: post?.title || '',
    platform: post?.platform || 'Instagram',
    content: post?.content || '',
    assetUrl: post?.assetUrl || '',
    stage: post?.stage ?? 0,
    status: post?.status || 'draft',
    scheduledDate: post?.scheduledDate || '',
    assignee: post?.assignee || '',
    client: post?.client || '',
    metrics: post?.metrics || { likes: 0, shares: 0, comments: 0, reach: 0 },
    comments: post?.comments || [],
    // Ersteller für rollenbasierte Filterung
    createdBy: post?.createdBy || currentUser?.id || '',
    createdByName: post?.createdByName || currentUser?.name || '',
  })
  const [newComment, setNewComment] = useState('')
  const [trackChanges, setTrackChanges] = useState([])
  const [showViralAnalyzer, setShowViralAnalyzer] = useState(false)
  const [localImage, setLocalImage] = useState(null) // { previewUrl } — nur für lokale Vorschau
  const imageRef = useRef(null)

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => setLocalImage({ previewUrl: e.target.result })
    reader.readAsDataURL(file)
  }

  const addComment = () => {
    if (!newComment.trim()) return
    const comment = {
      user: isClient ? 'Kunde' : 'Agentur',
      msg: newComment,
      date: new Date().toISOString(),
    }
    update('comments', [...form.comments, comment])
    setNewComment('')
  }

  const handleSave = () => {
    onSave(form)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isNew ? 'Neuer Post' : post.title}
            </h2>
            <div className="flex items-center gap-2">
              {!isClient && (
                <button
                  onClick={() => setShowViralAnalyzer(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Viral-Analyse
                </button>
              )}
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titel</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => update('title', e.target.value)}
                    className="input"
                    placeholder="z.B. Reel: Produktlaunch Q2"
                    disabled={isClient}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plattform</label>
                    <select
                      value={form.platform}
                      onChange={(e) => update('platform', e.target.value)}
                      className="input"
                      disabled={isClient}
                    >
                      <option>Instagram</option>
                      <option>LinkedIn</option>
                      <option>Facebook</option>
                      <option>TikTok</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phase</label>
                    <select
                      value={form.stage}
                      onChange={(e) => update('stage', parseInt(e.target.value))}
                      className="input"
                      disabled={isClient}
                    >
                      {STAGES.map((s, i) => <option key={i} value={i}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Caption / Text
                    <span className="text-gray-400 font-normal ml-2">{form.content.length} Zeichen</span>
                  </label>
                  <textarea
                    value={form.content}
                    onChange={(e) => update('content', e.target.value)}
                    rows={6}
                    className="input resize-none"
                    placeholder="Schreibe deinen Post-Text..."
                    disabled={isClient}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Geplantes Datum</label>
                  <input
                    type="date"
                    value={form.scheduledDate}
                    onChange={(e) => update('scheduledDate', e.target.value)}
                    className="input"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset URL</label>
                  <input
                    type="url"
                    value={form.assetUrl}
                    onChange={(e) => update('assetUrl', e.target.value)}
                    className="input"
                    placeholder="https://..."
                    disabled={isClient}
                  />
                </div>
              </div>

              {/* Right: Preview + Comments */}
              <div className="space-y-4">
                {/* Preview */}
                <div className="card p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Vorschau</h4>
                  <div
                    className={`bg-gray-100 dark:bg-gray-700 rounded-lg aspect-square flex items-center justify-center mb-3 overflow-hidden relative group ${!isClient ? 'cursor-pointer' : ''}`}
                    onClick={() => !isClient && imageRef.current?.click()}
                    onDragOver={(e) => { if (!isClient) e.preventDefault() }}
                    onDrop={(e) => { e.preventDefault(); if (!isClient) handleImageFile(e.dataTransfer.files[0]) }}
                  >
                    {localImage?.previewUrl || form.assetUrl ? (
                      <img
                        src={localImage?.previewUrl || form.assetUrl}
                        alt="Vorschau"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Image className="w-12 h-12 text-gray-300 dark:text-gray-500" />
                        {!isClient && <p className="text-xs text-gray-400">Klicken oder Bild hierher ziehen</p>}
                      </div>
                    )}
                    {!isClient && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageFile(e.target.files[0])} />
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4">{form.content || 'Kein Text vorhanden'}</p>
                </div>

                {/* Comments */}
                <div className="card p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Kommentare ({form.comments.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                    {form.comments.map((c, i) => (
                      <div key={i} className="flex gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${c.user === 'Kunde' ? 'bg-emerald-500' : 'bg-brand-500'}`}>
                          {c.user[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{c.user}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(c.date).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{c.msg}</p>
                        </div>
                      </div>
                    ))}
                    {form.comments.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">Noch keine Kommentare</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addComment()}
                      placeholder="Kommentar schreiben..."
                      className="input text-xs"
                    />
                    <button onClick={addComment} className="btn-primary px-3">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics (if published) */}
                {form.stage >= 5 && form.metrics && (
                  <div className="card p-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Metriken</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(form.metrics).map(([key, val]) => (
                        <div key={key} className="text-center">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{val.toLocaleString('de-DE')}</p>
                          <p className="text-xs text-gray-500 capitalize">{key}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {isClient ? (
              <>
                <button onClick={onClose} className="btn-secondary">Schliessen</button>
                <div className="flex gap-2">
                  <button
                    onClick={() => { update('status', 'revision_needed'); handleSave() }}
                    className="btn-danger"
                  >
                    Korrektur erforderlich
                  </button>
                  <button
                    onClick={() => { update('stage', 4); update('status', 'approved'); handleSave() }}
                    className="btn-primary"
                  >
                    Freigeben
                  </button>
                </div>
              </>
            ) : (
              <>
                <button onClick={onClose} className="btn-secondary">Abbrechen</button>
                <button onClick={handleSave} className="btn-primary">
                  {isNew ? 'Post erstellen' : 'Speichern'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showViralAnalyzer && (
        <ViralAnalyzer
          platform={form.platform}
          onClose={() => setShowViralAnalyzer(false)}
          onUseCaption={({ caption, image }) => {
            update('content', caption)
            if (image) setLocalImage(image)
            setShowViralAnalyzer(false)
          }}
        />
      )}
    </>
  )
}
