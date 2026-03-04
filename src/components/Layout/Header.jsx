import { Bell, Moon, Sun, Menu, LogOut, ChevronDown, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'

const viewTitles = {
  'social-discovery': 'Social Discovery',
  'keyword-explorer': 'Keyword Explorer',
  'social-hub': 'Social Media Hub',
  'seo-content': 'SEO & Web Content',
  'dashboard': 'Performance Dashboard',
  'post-analytics': 'Post-Analytics',
}

function NotifIcon({ type }) {
  if (type === 'success') return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
  if (type === 'error')   return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
  if (type === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
  return <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
}

function formatTime(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 10)   return 'Gerade eben'
  if (diff < 60)   return `vor ${diff} Sek.`
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

export default function Header() {
  const {
    currentView, darkMode, toggleDarkMode, sidebarOpen, toggleSidebar,
    notificationHistory, unreadCount, markNotificationsRead,
  } = useApp()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const menuRef = useRef(null)
  const bellRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleBellClick = (e) => {
    e.stopPropagation()
    setBellOpen(prev => {
      const next = !prev
      if (next && markNotificationsRead) markNotificationsRead()
      return next
    })
  }

  return (
    <header className={`fixed top-0 right-0 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-30 flex items-center justify-between px-6 transition-all ${sidebarOpen ? 'left-64' : 'left-20'}`}>
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden text-gray-500 hover:text-gray-700">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {viewTitles[currentView] || 'Dashboard'}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={handleBellClick}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            title="Benachrichtigungen"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold leading-none px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Benachrichtigungen</h3>
                {notificationHistory.length > 0 && (
                  <span className="text-xs text-gray-400">{notificationHistory.length} gesamt</span>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
                {notificationHistory.length === 0 ? (
                  <div className="py-10 text-center text-gray-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Keine Benachrichtigungen</p>
                  </div>
                ) : (
                  notificationHistory.map(n => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <NotifIcon type={n.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatTime(n.timestamp)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.avatar}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Abmelden
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
