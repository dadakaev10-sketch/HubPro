import { useState, useEffect } from 'react'
import {
  Users, Plus, Shield, Briefcase, User, Trash2, X,
  Eye, EyeOff, CheckCircle, Copy, Mail, Check, Send,
} from 'lucide-react'
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore'
import { db, DB_BASE_PATH, isFirebaseConfigured, auth } from '../../config/firebase'
import { getApps, initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth'
import { useApp } from '../../contexts/AppContext'

// Modul-Level Cache: Secondary App für User-Erstellung (vermeidet Logout des Admins)
function getSecondaryAuth() {
  const name = 'hubpro-user-creation'
  const existing = getApps().find(a => a.name === name)
  const app = existing ?? initializeApp(
    {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    },
    name
  )
  return getAuth(app)
}

const roleConfig = {
  Admin:   { icon: Shield,   color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',   label: 'Admin' },
  Agentur: { icon: Briefcase,color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',       label: 'Agentur' },
  Kunde:   { icon: User,     color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',label: 'Kunde' },
}

export default function UserManagement({ clients = [] }) {
  const { addNotification } = useApp()
  const [users, setUsers]                       = useState([])
  const [loading, setLoading]                   = useState(true)
  const [showForm, setShowForm]                 = useState(false)
  const [submitting, setSubmitting]             = useState(false)
  const [showPassword, setShowPassword]         = useState(false)
  const [form, setForm]                         = useState(emptyForm())
  const [createdCredentials, setCreatedCredentials] = useState(null)
  const [copiedField, setCopiedField]           = useState(null)
  const [sendingEmail, setSendingEmail]         = useState(false)
  const [emailSentFor, setEmailSentFor]         = useState(null)

  function emptyForm() {
    return { name: '', email: '', password: '', role: 'Agentur', clientId: '', clientName: '' }
  }

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    if (!isFirebaseConfigured) { setLoading(false); return }
    try {
      const snap = await getDocs(collection(db, `${DB_BASE_PATH}/users`))
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  async function handleCreateUser(e) {
    e.preventDefault()
    if (!form.email || !form.password || !form.name) return
    setSubmitting(true)
    try {
      const secondaryAuth = getSecondaryAuth()
      const { user } = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password)
      await signOut(secondaryAuth)

      const avatar = form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      const docData = {
        name: form.name, email: form.email, role: form.role, avatar,
        createdAt: new Date().toISOString(),
      }
      // Kunden-Verknüpfung nur wenn gesetzt
      if (form.role === 'Kunde' && form.clientId) {
        docData.clientId   = form.clientId
        docData.clientName = form.clientName
      }
      await setDoc(doc(db, `${DB_BASE_PATH}/users`, user.uid), docData)

      // Zugangsdaten merken → Modal anzeigen
      setCreatedCredentials({ name: form.name, email: form.email, password: form.password })
      setForm(emptyForm())
      setShowForm(false)
      loadUsers()
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use':    'Diese E-Mail wird bereits verwendet.',
        'auth/weak-password':           'Passwort muss mindestens 6 Zeichen haben.',
        'auth/invalid-email':           'Ungültige E-Mail-Adresse.',
        'auth/operation-not-allowed':   'E-Mail/Passwort-Login ist in Firebase nicht aktiviert.',
        'auth/network-request-failed':  'Netzwerkfehler — bitte Verbindung prüfen.',
      }
      addNotification({ type: 'error', message: msgs[err.code] || err.message })
      console.error('[UserManagement]', err.code, err.message)
    }
    setSubmitting(false)
  }

  async function handleSendSetupEmail(email, userId = null) {
    setSendingEmail(userId ?? 'new')
    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin,
      })
      addNotification({ type: 'success', message: `Setup-E-Mail an ${email} gesendet` })
      if (userId) {
        setEmailSentFor(userId)
        setTimeout(() => setEmailSentFor(null), 3000)
      }
    } catch (err) {
      const msgs = {
        'auth/user-not-found':          'Kein Account mit dieser E-Mail gefunden.',
        'auth/network-request-failed':  'Netzwerkfehler — bitte Verbindung prüfen.',
      }
      addNotification({ type: 'error', message: msgs[err.code] || err.message })
    }
    setSendingEmail(null)
  }

  function handleCopy(text, field) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  async function handleDeleteUser(userId, userName) {
    if (!confirm(`${userName} wirklich entfernen?`)) return
    try {
      await deleteDoc(doc(db, `${DB_BASE_PATH}/users`, userId))
      setUsers(prev => prev.filter(u => u.id !== userId))
      addNotification({ type: 'success', message: `${userName} wurde entfernt` })
    } catch {
      addNotification({ type: 'error', message: 'Fehler beim Löschen' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">User-Verwaltung</h2>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} Benutzer registriert</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Neuer User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(roleConfig).map(([role, cfg]) => {
          const Icon = cfg.icon
          return (
            <div key={role} className="card px-4 py-3 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${cfg.color}`}><Icon className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {users.filter(u => u.role === role).length}
                </p>
                <p className="text-xs text-gray-500">{cfg.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* User Liste */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Lade Benutzer...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Keine Benutzer gefunden</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Benutzer</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3 hidden sm:table-cell">E-Mail</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">Rolle</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-3">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {users.map(user => {
                const cfg = roleConfig[user.role] || roleConfig.Kunde
                const Icon = cfg.icon
                const isSending = sendingEmail === user.id
                const wasSent   = emailSentFor === user.id
                return (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-sm font-bold text-brand-700 dark:text-brand-400">
                          {user.avatar || user.name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-400 sm:hidden">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 badge ${cfg.color}`}>
                        <Icon className="w-3 h-3" />{user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Setup-E-Mail senden */}
                        <button
                          onClick={() => handleSendSetupEmail(user.email, user.id)}
                          disabled={isSending || wasSent}
                          title="Login-Link per E-Mail senden"
                          className={`p-1.5 rounded-lg transition-colors ${
                            wasSent
                              ? 'text-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                          }`}
                        >
                          {isSending
                            ? <span className="w-4 h-4 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin block" />
                            : wasSent
                              ? <Check className="w-4 h-4" />
                              : <Mail className="w-4 h-4" />
                          }
                        </button>
                        {/* Löschen */}
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Neuer User Modal ─────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Neuen User anlegen</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Max Mustermann" className="input w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-Mail</label>
                <input type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="max@beispiel.de" className="input w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passwort</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Mindestens 6 Zeichen"
                    className="input w-full pr-10" required minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rolle</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(roleConfig).map(([role, cfg]) => {
                    const Icon = cfg.icon
                    return (
                      <button key={role} type="button" onClick={() => setForm(f => ({ ...f, role }))}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                          form.role === role
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}>
                        <Icon className={`w-5 h-5 ${form.role === role ? 'text-brand-600' : 'text-gray-400'}`} />
                        <span className={`text-xs font-medium ${form.role === role ? 'text-brand-700 dark:text-brand-400' : 'text-gray-500'}`}>
                          {cfg.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              {/* Kunden-Zuordnung (nur bei Rolle Kunde) */}
              {form.role === 'Kunde' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Zugehöriger Kunde
                    <span className="ml-1 text-xs text-gray-400 font-normal">(optional)</span>
                  </label>
                  {clients.length === 0 ? (
                    <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                      Noch keine Kunden angelegt. Zuerst in der Kundenverwaltung einen Kunden erstellen.
                    </p>
                  ) : (
                    <select
                      value={form.clientId}
                      onChange={e => {
                        const selected = clients.find(c => c.id === e.target.value)
                        setForm(f => ({
                          ...f,
                          clientId:   selected?.id   || '',
                          clientName: selected?.company || '',
                        }))
                      }}
                      className="input w-full"
                    >
                      <option value="">— Keinem Kunden zuordnen —</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.company}</option>
                      ))}
                    </select>
                  )}
                  {form.clientName && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✓ Dieser User sieht nur Posts und Artikel von „{form.clientName}"
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">
                  Abbrechen
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center disabled:opacity-50">
                  {submitting
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><CheckCircle className="w-4 h-4" /> Anlegen</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Zugangsdaten Modal (nach Anlegen) ────────────────── */}
      {createdCredentials && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {createdCredentials.name} wurde angelegt
                  </h3>
                  <p className="text-sm text-gray-500">Zugangsdaten für den neuen Benutzer</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* E-Mail */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">E-Mail</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-gray-800 dark:text-gray-200 select-all">
                    {createdCredentials.email}
                  </div>
                  <button
                    onClick={() => handleCopy(createdCredentials.email, 'email')}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Kopieren"
                  >
                    {copiedField === 'email'
                      ? <Check className="w-4 h-4 text-green-500" />
                      : <Copy className="w-4 h-4 text-gray-500" />
                    }
                  </button>
                </div>
              </div>

              {/* Passwort */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Passwort</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-gray-800 dark:text-gray-200 select-all">
                    {createdCredentials.password}
                  </div>
                  <button
                    onClick={() => handleCopy(createdCredentials.password, 'password')}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Kopieren"
                  >
                    {copiedField === 'password'
                      ? <Check className="w-4 h-4 text-green-500" />
                      : <Copy className="w-4 h-4 text-gray-500" />
                    }
                  </button>
                </div>
              </div>

              {/* Hinweis */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                💡 Teile die Zugangsdaten sicher mit dem Benutzer, oder sende ihm einen Passwort-Reset-Link per E-Mail.
              </div>

              {/* Aktionen */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => handleSendSetupEmail(createdCredentials.email, 'new')}
                  disabled={sendingEmail === 'new'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-brand-500 text-brand-600 dark:text-brand-400 font-medium text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors disabled:opacity-50"
                >
                  {sendingEmail === 'new'
                    ? <span className="w-4 h-4 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                  Setup-E-Mail senden
                </button>
                <button
                  onClick={() => setCreatedCredentials(null)}
                  className="flex-1 btn-primary justify-center"
                >
                  Fertig
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
