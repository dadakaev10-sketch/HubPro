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
import ClientPortal from './components/Client/ClientPortal'
import { socialPostsService, seoArticlesService, clientsService, notificationsService } from './services/firestore'
import { isFirebaseConfigured } from './config/firebase'

function AppContent() {
  const { user, isClient, isAdmin, loading: authLoading } = useAuth()
  const { currentView, setCurrentView, addNotification, setFirestoreNotifs, VIEWS } = useApp()

  const [posts, setPosts] = useState([])
  const [articles, setArticles] = useState([])
  const [clients, setClients] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  // Kunden landen beim Login direkt im Client-Portal
  useEffect(() => {
    if (user && isClient) {
      const hash = window.location.hash.slice(1)
      // Nur umleiten wenn kein gültiger Kunden-Hash gesetzt ist
      const clientViews = new Set([VIEWS.CLIENT_PORTAL, VIEWS.SOCIAL_HUB, VIEWS.SEO_CONTENT])
      if (!clientViews.has(hash)) {
        setCurrentView(VIEWS.CLIENT_PORTAL)
      }
    }
  }, [user, isClient, setCurrentView, VIEWS])

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

    // Echtzeit-Benachrichtigungen – alle laden, client-seitig filtern
    const unsubNotifs = notificationsService.subscribe((allNotifs) => {
      const relevant = allNotifs.filter(n => {
        // Eigene Aktionen nicht anzeigen
        if (n.createdBy === user.id) return false
        // Direkt an mich adressiert
        if (n.recipientId === user.id) return true
        // An meine Rolle adressiert
        if (n.recipientRole === user.role) {
          // Kunden sehen nur Notifications ihrer Firma
          if (user.role === 'Kunde') return n.clientName === user.clientName
          return true
        }
        return false
      })
      setFirestoreNotifs(relevant)
    })

    return () => {
      unsubPosts()
      unsubArticles()
      unsubClients()
      unsubNotifs()
    }
  }, [user, setFirestoreNotifs])

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
      const isExisting = updatedPost.id && posts.find(p => p.id === updatedPost.id)
      if (isExisting) {
        const { id, ...data } = updatedPost
        await socialPostsService.update(id, data)
      } else {
        await socialPostsService.create(updatedPost)
      }
      addNotification({ type: 'success', message: 'Post erfolgreich gespeichert' })

      // ── Cross-User Notification erstellen ──
      try {
        const oldPost = isExisting ? posts.find(p => p.id === updatedPost.id) : null
        const statusChanged = oldPost && oldPost.status !== updatedPost.status

        if (isClient) {
          // Kunde hat etwas geändert → Agentur benachrichtigen
          const isApproval = statusChanged && (updatedPost.status === 'approved' || updatedPost.status === 'published')
          await notificationsService.create({
            type: isApproval ? 'post_approved' : 'post_updated',
            message: isApproval
              ? `${user.name} hat Post „${updatedPost.title}" freigegeben`
              : `${user.name} hat Post „${updatedPost.title}" kommentiert`,
            recipientId: updatedPost.createdBy || null,
            recipientRole: 'Agentur',
            clientName: updatedPost.client || user.clientName || null,
            createdBy: user.id,
            createdByName: user.name,
            refCollection: 'social_posts',
            refId: updatedPost.id || null,
          })
        } else {
          // Agentur/Admin hat etwas geändert → Kunde benachrichtigen
          if (updatedPost.client) {
            await notificationsService.create({
              type: 'post_updated',
              message: `${user.name} hat Post „${updatedPost.title}" aktualisiert`,
              recipientId: null,
              recipientRole: 'Kunde',
              clientName: updatedPost.client,
              createdBy: user.id,
              createdByName: user.name,
              refCollection: 'social_posts',
              refId: updatedPost.id || null,
            })
          }
        }
      } catch (notifErr) {
        console.warn('Notification konnte nicht erstellt werden:', notifErr)
      }
    } catch (err) {
      console.error(err)
      addNotification({ type: 'error', message: 'Fehler beim Speichern' })
    }
  }, [posts, addNotification, user, isClient])

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
      const isExisting = updatedArticle.id && articles.find(a => a.id === updatedArticle.id)
      if (isExisting) {
        const { id, ...data } = updatedArticle
        await seoArticlesService.update(id, data)
      } else {
        await seoArticlesService.create(updatedArticle)
      }
      addNotification({ type: 'success', message: 'Artikel erfolgreich gespeichert' })

      // ── Cross-User Notification erstellen ──
      try {
        const oldArticle = isExisting ? articles.find(a => a.id === updatedArticle.id) : null
        const statusChanged = oldArticle && oldArticle.status !== updatedArticle.status

        if (isClient) {
          // Kunde hat Status geändert → Agentur benachrichtigen
          const isApproval = statusChanged && (updatedArticle.status === 'approved' || updatedArticle.status === 'published')
          if (statusChanged) {
            await notificationsService.create({
              type: isApproval ? 'article_approved' : 'article_updated',
              message: isApproval
                ? `${user.name} hat Artikel „${updatedArticle.title}" freigegeben`
                : `${user.name} hat Artikel „${updatedArticle.title}" aktualisiert`,
              recipientId: updatedArticle.createdBy || null,
              recipientRole: 'Agentur',
              clientName: updatedArticle.client || user.clientName || null,
              createdBy: user.id,
              createdByName: user.name,
              refCollection: 'seo_articles',
              refId: updatedArticle.id || null,
            })
          }
        } else {
          // Agentur/Admin hat Artikel geändert → Kunde benachrichtigen
          if (updatedArticle.client) {
            await notificationsService.create({
              type: 'article_updated',
              message: `${user.name} hat Artikel „${updatedArticle.title}" aktualisiert`,
              recipientId: null,
              recipientRole: 'Kunde',
              clientName: updatedArticle.client,
              createdBy: user.id,
              createdByName: user.name,
              refCollection: 'seo_articles',
              refId: updatedArticle.id || null,
            })
          }
        }
      } catch (notifErr) {
        console.warn('Notification konnte nicht erstellt werden:', notifErr)
      }
    } catch (err) {
      console.error(err)
      addNotification({ type: 'error', message: 'Fehler beim Speichern' })
    }
  }, [articles, addNotification, user, isClient])

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
    // Kunden die direkt auf eine Agentur-Seite navigieren → zurück zum Portal
    const clientFallback = <ClientPortal posts={posts} articles={articles} onUpdatePost={handleUpdatePost} onUpdateArticle={handleUpdateArticle} clients={clients} />

    switch (currentView) {
      case VIEWS.CLIENT_PORTAL:
        return clientFallback
      case VIEWS.SOCIAL_DISCOVERY:
        return isClient ? clientFallback : <SocialDiscovery />
      case VIEWS.KEYWORD_EXPLORER:
        return isClient ? clientFallback : <KeywordExplorer />
      case VIEWS.SOCIAL_HUB:
        return <SocialHub posts={posts} onUpdatePost={handleUpdatePost} isClient={isClient} loading={dataLoading} clients={clients} clientName={user?.clientName || null} />
      case VIEWS.SEO_CONTENT:
        return <SEOHub articles={articles} onUpdateArticle={handleUpdateArticle} isClient={isClient} loading={dataLoading} clients={clients} clientName={user?.clientName || null} />
      case VIEWS.DASHBOARD:
        return isClient ? clientFallback : <PerformanceDashboard posts={posts} articles={articles} />
      case VIEWS.POST_ANALYTICS:
        return isClient ? clientFallback : <PostAnalytics posts={posts} />
      case VIEWS.USER_MANAGEMENT:
        return isAdmin ? <UserManagement clients={clients} /> : (isClient ? clientFallback : <PerformanceDashboard posts={posts} articles={articles} />)
      case VIEWS.CLIENT_MANAGEMENT:
        return isClient ? clientFallback : <ClientManagement clients={clients} />
      default:
        return isClient ? clientFallback : <PerformanceDashboard posts={posts} articles={articles} />
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
