import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

const VIEWS = {
  SOCIAL_DISCOVERY: 'social-discovery',
  KEYWORD_EXPLORER: 'keyword-explorer',
  SOCIAL_HUB: 'social-hub',
  SEO_CONTENT: 'seo-content',
  DASHBOARD: 'dashboard',
  POST_ANALYTICS: 'post-analytics',
  USER_MANAGEMENT: 'user-management',
}

export function AppProvider({ children }) {
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState([])

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
