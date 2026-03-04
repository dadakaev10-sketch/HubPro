import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured, DB_BASE_PATH } from '../config/firebase'

const AuthContext = createContext(null)

export const ROLES = {
  ADMIN: 'Admin',
  AGENCY: 'Agentur',
  CLIENT: 'Kunde',
}

// Demo-Fallback wenn Firebase nicht konfiguriert ist
const DEMO_USERS = [
  { id: 'u1', email: 'admin@hubpro.de', name: 'Max Müller', role: ROLES.ADMIN, avatar: 'MM' },
  { id: 'u2', email: 'agentur@hubpro.de', name: 'Sarah Schmidt', role: ROLES.AGENCY, avatar: 'SS' },
  { id: 'u3', email: 'kunde@hubpro.de', name: 'Thomas Weber', role: ROLES.CLIENT, avatar: 'TW' },
]

// Liest Benutzer-Rolle aus Firestore
async function fetchUserProfile(firebaseUser) {
  const userRef = doc(db, `${DB_BASE_PATH}/users`, firebaseUser.uid)
  const snap = await getDoc(userRef)
  if (snap.exists()) {
    const data = snap.data()
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: data.name || firebaseUser.displayName || firebaseUser.email,
      role: data.role || ROLES.CLIENT,
      avatar: data.avatar || firebaseUser.email?.slice(0, 2).toUpperCase(),
    }
  }
  // Neu-Registrierung: Standard-Rolle Kunde
  const newProfile = {
    name: firebaseUser.displayName || firebaseUser.email,
    role: ROLES.CLIENT,
    avatar: firebaseUser.email?.slice(0, 2).toUpperCase(),
    createdAt: new Date().toISOString(),
  }
  await setDoc(userRef, newProfile)
  return { id: firebaseUser.uid, email: firebaseUser.email, ...newProfile }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Demo-Modus: kein Auth-Listener nötig
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await fetchUserProfile(firebaseUser)
          setUser(profile)
        } catch (err) {
          console.error('Fehler beim Laden des Profils:', err)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = useCallback(async (email, password) => {
    if (!isFirebaseConfigured) {
      // Demo-Modus
      setLoading(true)
      await new Promise(r => setTimeout(r, 400))
      const found = DEMO_USERS.find(u => u.email === email)
      setLoading(false)
      if (found) {
        setUser(found)
        return { success: true }
      }
      return { success: false, error: 'Ungültige Anmeldedaten' }
    }

    try {
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
      // onAuthStateChanged setzt den User automatisch
      return { success: true }
    } catch (err) {
      setLoading(false)
      const messages = {
        'auth/user-not-found': 'Kein Konto mit dieser E-Mail gefunden.',
        'auth/wrong-password': 'Falsches Passwort.',
        'auth/invalid-credential': 'Ungültige Anmeldedaten.',
        'auth/too-many-requests': 'Zu viele Versuche. Bitte warte kurz.',
      }
      return { success: false, error: messages[err.code] || 'Anmeldung fehlgeschlagen.' }
    }
  }, [])

  // Nur im Demo-Modus verfügbar
  const loginAsRole = useCallback((role) => {
    if (isFirebaseConfigured) return
    const found = DEMO_USERS.find(u => u.role === role)
    if (found) setUser(found)
  }, [])

  const logout = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setUser(null)
      return
    }
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Logout-Fehler:', err)
    }
  }, [])

  const isAdmin = user?.role === ROLES.ADMIN
  const isAgency = user?.role === ROLES.AGENCY || user?.role === ROLES.ADMIN
  const isClient = user?.role === ROLES.CLIENT

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      loginAsRole: isFirebaseConfigured ? null : loginAsRole,
      logout,
      isAdmin,
      isAgency,
      isClient,
      ROLES,
      isFirebaseConfigured,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
