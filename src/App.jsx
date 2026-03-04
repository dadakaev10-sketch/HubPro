import { useState, useEffect, useCallback } from 'react'
import { AppProvider, useApp, VIEWS } from './contexts/AppContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import LoginPage from './components/Auth/LoginPage'
import SocialHub from './components/SocialMedia/SocialHub'
import SEOHub from './components/SEO/SEOHub'
import SocialDiscovery from './components/Discovery/SocialDiscovery'
import KeywordExplorer from './components/Discovery/KeywordExplorer'
import PerformanceDashboard from './components/Analytics/PerformanceDashboard'
import PostAnalytics from './components/Analytics/PostAnalytics'
import UserManagement from './components/Admin/UserManagement'
import ClientManagement from './components/Admin/ClientManagement'
import { socialPostsService, seoArticlesService, clientsService } from './services/firestore'
import { isFirebaseConfigured } from './config/firebase'

function AppContent() {
  const { user, isClient, isAdmin, loading: authLoading } = useAuth()
  const { currentView, addNotification } = useApp()

  const [posts, setPosts] = useState([])
  const [articles, setArticles] = useState([])
  const [clients, setClients] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  // Echtzeit-Listener für Firestore (oder Mock-Daten Fallback)
  useEffect(() => {
    if (!user) return

    setDataLoading(true)

    const unsubPosts = socialPostsService.subscribe((data) => {
      setPosts(data)
      setDataLoading(false)
    })

    const unsubArticles = seoArticlesService.subscribe((data) => {
      setArticles(data)
    })

    const unsubClients = clientsService.subscribe((data) => {
      setClients(data)
    })

    return () => {
      unsubPosts()
      unsubArticles()
      unsubClients()
    }
  }, [user])

  const handleUpdatePost = useCallback(async (updatedPost) => {
    if (!isFirebaseConfigured) {
      setPosts(prev => {
        const exists = prev.find(p => p.id === updatedPost.id)
        return exists
          ? prev.map(p => p.id === updatedPost.id ? updatedPost : p)
          : [updatedPost, ...prev]
      })
      addNotification({ type: 'success', message: 'Post erfolgreich gespeichert' })
      return
    }
    try {
      if (updatedPost.id && posts.find(p => p.id === updatedPost.id)) {
        const { id, ...data } = updatedPost
        await socialPostsService.update(id, data)
      } else {
        await socialPostsService.create(updatedPost)
      }
      addNotification({ type: 'success', message: 'Post erfolgreich gespeichert' })
    } catch (err) {
      console.error(err)
      addNotification({ type: 'error', message: 'Fehler beim Speichern' })
    }
  }, [posts, addNotification])

  const handleUpdateArticle = useCallback(async (updatedArticle) => {
    if (!isFirebaseConfigured) {
      setArticles(prev => {
        const exists = prev.find(a => a.id === updatedArticle.id)
        return exists
          ? prev.map(a => a.id === updatedArticle.id ? updatedArticle : a)
          : [updatedArticle, ...prev]
      })
      addNotification({ type: 'success', message: 'Artikel erfolgreich gespeichert' })
      return
    }
    try {
      if (updatedArticle.id && articles.find(a => a.id === updatedArticle.id)) {
        const { id, ...data } = updatedArticle
        await seoArticlesService.update(id, data)
      } else {
        await seoArticlesService.create(updatedArticle)
      }
      addNotification({ type: 'success', message: 'Artikel erfolgreich gespeichert' })
    } catch (err) {
      console.error(err)
      addNotification({ type: 'error', message: 'Fehler beim Speichern' })
    }
  }, [articles, addNotification])

  if (authLoading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-600/30 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Wird geladen…</p>
      </div>
    </div>
  )
  if (!user) return <LoginPage />

  const renderView = () => {
    switch (currentView) {
      case VIEWS.SOCIAL_DISCOVERY:
        return <SocialDiscovery />
      case VIEWS.KEYWORD_EXPLORER:
        return <KeywordExplorer />
      case VIEWS.SOCIAL_HUB:
        return <SocialHub posts={posts} onUpdatePost={handleUpdatePost} isClient={isClient} loading={dataLoading} clients={clients} />
      case VIEWS.SEO_CONTENT:
        return <SEOHub articles={articles} onUpdateArticle={handleUpdateArticle} isClient={isClient} loading={dataLoading} clients={clients} />
      case VIEWS.DASHBOARD:
        return <PerformanceDashboard posts={posts} articles={articles} />
      case VIEWS.POST_ANALYTICS:
        return <PostAnalytics posts={posts} />
      case VIEWS.USER_MANAGEMENT:
        return isAdmin ? <UserManagement /> : <PerformanceDashboard posts={posts} articles={articles} />
      case VIEWS.CLIENT_MANAGEMENT:
        return <ClientManagement clients={clients} />
      default:
        return <PerformanceDashboard posts={posts} articles={articles} />
    }
  }

  return (
    <Layout>
      {renderView()}
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  )
}
