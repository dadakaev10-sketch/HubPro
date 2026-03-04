import {
  LayoutDashboard,
  Hash,
  Search,
  FileText,
  BarChart3,
  TrendingUp,
  ChevronLeft,
  Compass,
  KeyRound,
  Megaphone,
  PenTool,
  Activity,
  Users,
  Building2,
  Home,
} from 'lucide-react'
import { useApp, VIEWS } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'

const menuSections = [
  {
    title: 'Mein Bereich',
    items: [
      { id: VIEWS.CLIENT_PORTAL, label: 'Mein Portal', icon: Home, clientOnly: true },
    ],
  },
  {
    title: 'Strategie & Recherche',
    items: [
      { id: VIEWS.SOCIAL_DISCOVERY, label: 'Social Discovery', icon: Compass, agencyOnly: true },
      { id: VIEWS.KEYWORD_EXPLORER, label: 'Keyword Explorer', icon: Search, agencyOnly: true },
    ],
  },
  {
    title: 'Management',
    items: [
      { id: VIEWS.SOCIAL_HUB, label: 'Social Media Hub', icon: Megaphone },
      { id: VIEWS.SEO_CONTENT, label: 'SEO & Web Content', icon: PenTool },
    ],
  },
  {
    title: 'Reporting',
    items: [
      { id: VIEWS.DASHBOARD, label: 'Performance Dashboard', icon: BarChart3 },
      { id: VIEWS.POST_ANALYTICS, label: 'Post-Analytics', icon: Activity },
    ],
  },
  {
    title: 'Administration',
    items: [
      { id: VIEWS.USER_MANAGEMENT, label: 'User-Verwaltung', icon: Users, adminOnly: true },
      { id: VIEWS.CLIENT_MANAGEMENT, label: 'Kundenverwaltung', icon: Building2, agencyOnly: false, adminOrAgency: true },
    ],
  },
]

export default function Sidebar() {
  const { currentView, setCurrentView, sidebarOpen, toggleSidebar } = useApp()
  const { isClient, isAdmin } = useAuth()

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 flex flex-col ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
              Content Hub
              <span className="text-brand-600"> Pro</span>
            </h1>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {menuSections.map((section) => {
          const visibleItems = section.items.filter(item => {
            if (item.clientOnly && !isClient) return false   // Nur für Kunden
            if (item.agencyOnly && isClient) return false    // Nur für Agentur
            if (item.adminOnly && !isAdmin) return false
            if (item.adminOrAgency && isClient) return false
            return true
          })
          if (visibleItems.length === 0) return null

          return (
            <div key={section.title} className="mb-6">
              {sidebarOpen && (
                <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              <ul className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  const active = currentView === item.id
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setCurrentView(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          active
                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                        } ${!sidebarOpen ? 'justify-center' : ''}`}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-brand-600 dark:text-brand-400' : ''}`} />
                        {sidebarOpen && <span className="truncate">{item.label}</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-12 border-t border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
      >
        <ChevronLeft className={`w-5 h-5 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
      </button>
    </aside>
  )
}
