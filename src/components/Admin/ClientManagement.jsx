import { useState, useMemo } from 'react'
import { Building2, Plus, Pencil, Trash2, X, Save, Globe, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { clientsService } from '../../services/firestore'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { isFirebaseConfigured } from '../../config/firebase'

export default function ClientManagement({ clients }) {
  const { addNotification } = useApp()
  const { user, isAdmin } = useAuth()

  // Admin sieht alle Kunden, Agentur nur eigene
  const visibleClients = useMemo(() => {
    if (isAdmin) return clients
    return clients.filter(c => c.createdBy === user?.id)
  }, [clients, isAdmin, user?.id])
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState(emptyForm())

  function emptyForm() {
    return { company: '', name: '', email: '', wpApiUrl: '', wpUsername: '', wpAppPassword: '' }
  }

  function openCreate() {
    setEditingClient(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  function openEdit(client) {
    setEditingClient(client)
    setForm({
      company:        client.company || '',
      name:           client.name || '',
      email:          client.email || '',
      wpApiUrl:       client.wpApiUrl || '',
      wpUsername:     client.wpUsername || '',
      wpAppPassword:  client.wpAppPassword || '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.company.trim()) return
    setSubmitting(true)
    try {
      const initials = form.company.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
      const data = { ...form, avatar: initials }
      if (!editingClient) {
        // Ersteller speichern damit Agentur nur eigene Kunden sieht
        data.createdBy = user?.id || ''
        data.createdByName = user?.name || ''
      }
      if (editingClient) {
        await clientsService.update(editingClient.id, data)
        addNotification({ type: 'success', message: 'Kunde aktualisiert' })
      } else {
        await clientsService.create(data)
        addNotification({ type: 'success', message: 'Kunde erstellt' })
      }
      setShowForm(false)
    } catch (err) {
      addNotification({ type: 'error', message: err.message })
    }
    setSubmitting(false)
  }

  async function handleDelete(client) {
    if (!window.confirm(`Kunde „${client.company}" wirklich löschen?`)) return
    try {
      await clientsService.delete(client.id)
      addNotification({ type: 'success', message: 'Kunde gelöscht' })
    } catch (err) {
      addNotification({ type: 'error', message: err.message })
    }
  }

  const wpConfigured = (c) => Boolean(c.wpApiUrl && c.wpUsername && c.wpAppPassword)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Kundenverwaltung</h2>
          <p className="text-sm text-gray-500 mt-1">{visibleClients.length} Kunden · WordPress-Integration per Kunde konfigurierbar</p>
        </div>
        <button onClick={openCreate} className="btn-primary" disabled={!isFirebaseConfigured}>
          <Plus className="w-4 h-4" />
          Neuer Kunde
        </button>
      </div>

      {!isFirebaseConfigured && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-700 dark:text-amber-400">
          Im Demo-Modus werden Kunden nur angezeigt. Zum Erstellen/Bearbeiten ist Firebase erforderlich.
        </div>
      )}

      {/* Client list */}
      <div className="space-y-3">
        {visibleClients.map(client => (
          <div key={client.id} className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold text-sm shrink-0">
              {client.avatar || client.company?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">{client.company}</p>
              <p className="text-sm text-gray-500 truncate">{client.name} · {client.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {wpConfigured(client) ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  WordPress
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  <Globe className="w-3 h-3" />
                  Kein WP
                </span>
              )}
              {isFirebaseConfigured && (
                <>
                  <button onClick={() => openEdit(client)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(client)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {visibleClients.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Noch keine Kunden angelegt</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {editingClient ? 'Kunde bearbeiten' : 'Neuer Kunde'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Firmenname *</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                  className="input"
                  placeholder="Muster GmbH"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ansprechpartner</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="input"
                    placeholder="Max Muster"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-Mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="input"
                    placeholder="max@muster.de"
                  />
                </div>
              </div>

              {/* WP Integration */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-brand-500" />
                  WordPress-Integration (optional)
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">WordPress URL</label>
                    <input
                      type="url"
                      value={form.wpApiUrl}
                      onChange={e => setForm(p => ({ ...p, wpApiUrl: e.target.value }))}
                      className="input"
                      placeholder="https://muster-gmbh.de"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">WP Benutzername</label>
                      <input
                        type="text"
                        value={form.wpUsername}
                        onChange={e => setForm(p => ({ ...p, wpUsername: e.target.value }))}
                        className="input"
                        placeholder="admin"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">App-Passwort</label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={form.wpAppPassword}
                          onChange={e => setForm(p => ({ ...p, wpAppPassword: e.target.value }))}
                          className="input pr-9"
                          placeholder="xxxx xxxx xxxx xxxx"
                        />
                        <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">App-Passwort in WordPress erstellen: WP-Admin → Benutzer → Profil → Anwendungspasswörter</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Abbrechen</button>
                <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
                  {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingClient ? 'Speichern' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
