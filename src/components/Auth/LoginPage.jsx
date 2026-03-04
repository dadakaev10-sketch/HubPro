import { useState } from 'react'
import { FileText, Mail, Lock, Eye, EyeOff, ArrowRight, Users, User, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginPage() {
  const { login, register, loginAsRole, loading, ROLES, isFirebaseConfigured } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [registered, setRegistered] = useState(false)

  // Login fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Register fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPassword2, setRegPassword2] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(email, password)
    if (!result.success) setError(result.error)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (regPassword !== regPassword2) {
      setError('Passwörter stimmen nicht überein.')
      return
    }
    if (!regName.trim()) {
      setError('Bitte gib deinen Namen ein.')
      return
    }
    const result = await register(regName, regEmail, regPassword)
    if (result.success) {
      setRegistered(true)
    } else {
      setError(result.error)
    }
  }

  const switchMode = (m) => {
    setMode(m)
    setError('')
    setRegistered(false)
  }

  const demoAccounts = [
    { role: ROLES.ADMIN, label: 'Admin', desc: 'Voller Zugriff', color: 'bg-purple-600' },
    { role: ROLES.AGENCY, label: 'Agentur', desc: 'Content erstellen & verwalten', color: 'bg-brand-600' },
    { role: ROLES.CLIENT, label: 'Kunde', desc: 'Freigaben & Feedback', color: 'bg-emerald-600' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/30">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Content Hub <span className="text-brand-400">Pro</span>
          </h1>
          <p className="text-gray-400 mt-2">Enterprise Content Management Platform</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50 dark:bg-brand-900/10'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Anmelden
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50 dark:bg-brand-900/10'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Registrieren
            </button>
          </div>

          <div className="p-8">
            {/* ── LOGIN ── */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-Mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@agentur.de"
                      className="input pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passwort</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Passwort eingeben"
                      className="input pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-2.5 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Anmelden <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}

            {/* ── REGISTER ── */}
            {mode === 'register' && !registered && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Max Mustermann"
                      className="input pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-Mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@agentur.de"
                      className="input pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passwort</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mindestens 6 Zeichen"
                      className="input pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passwort bestätigen</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={regPassword2}
                      onChange={(e) => setRegPassword2(e.target.value)}
                      placeholder="Passwort wiederholen"
                      className="input pl-10"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
                )}

                {!isFirebaseConfigured && (
                  <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                    Registrierung nur mit Firebase möglich. Im Demo-Modus bitte einen Demo-Account verwenden.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !isFirebaseConfigured}
                  className="btn-primary w-full justify-center py-2.5 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Konto erstellen <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}

            {/* ── REGISTER SUCCESS ── */}
            {mode === 'register' && registered && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Konto erstellt!</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Dein Konto wurde erfolgreich angelegt. Du wirst automatisch angemeldet.
                </p>
                <button onClick={() => switchMode('login')} className="btn-primary w-full justify-center">
                  Zur Anmeldung
                </button>
              </div>
            )}

            {/* Demo-Zugang nur ohne Firebase */}
            {!isFirebaseConfigured && mode === 'login' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white dark:bg-gray-800 px-3 text-gray-500">
                      <Users className="w-4 h-4 inline mr-1" />
                      Demo-Zugang
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {demoAccounts.map(({ role, label, desc, color }) => (
                    <button
                      key={role}
                      onClick={() => loginAsRole(role)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                    >
                      <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform`}>
                        {label[0]}
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
                      <span className="text-[10px] text-gray-400 text-center leading-tight">{desc}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
