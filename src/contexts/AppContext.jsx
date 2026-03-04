import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AppContext = createContext(null)

const VIEWS = {
  SOCIAL_DISCOVERY: 'social-discovery',
  KEYWORD_EXPLORER: 'keyword-explorer',
  SOCIAL_HUB: 'social-hub',
  SEO_CONTENT: 'seo-content',
  DASHBOARD: 'dashboard',
  POST_ANALYTICS: 'post-analytics',
  USER_MANAGEMENT: 'user-management',
  CLIENT_MANAGEMENT: 'client-management',
}

const VALID_VIEWS = new Set(Object.values(VIEWS))

function getInitialView() {
  const hash = window.location.hash.slice(1)
  return VALID_VIEWS.has(hash) ? hash : VIEWS.DASHBOARD
}

export function AppProvider({ children }) {
  const [currentView, setCurrentViewState] = useState(getInitialView)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState([])

  // View im URL-Hash speichern
  const setCurrentView = useCallback((view) => {
    setCurrentViewState(view)
    window.location.hash = view
  }, [])

  // Browser Zurück/Vor synchronisieren
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (VALID_VIEWS.has(hash)) setCurrentViewState(hash)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), [])
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }, [])

  const addNotification = useCallback((notification) => {
    const id = Date.now()
    setNotifications(prev => [...prev, { ...notification, id }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 4000)
  }, [])

  return (
    <AppContext.Provider value={{
      currentView,
      setCurrentView,
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      darkMode,
      toggleDarkMode,
      notifications,
      addNotification,
      VIEWS,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export { VIEWS }
