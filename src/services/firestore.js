/**
 * Firestore Service Layer
 * Collections laut Dokumentation: /artifacts/{appId}/public/data/
 * - social_posts
 * - seo_articles
 * - users
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db, DB_BASE_PATH, isFirebaseConfigured } from '../config/firebase'
import { socialPosts, seoArticles } from '../data/mockData'

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

function colRef(collectionName) {
  return collection(db, `${DB_BASE_PATH}/${collectionName}`)
}

function docRef(collectionName, id) {
  return doc(db, `${DB_BASE_PATH}/${collectionName}`, id)
}

// ─── Social Posts ─────────────────────────────────────────────────────────────

export const socialPostsService = {
  // Einmalig alle Posts laden
  async getAll() {
    if (!isFirebaseConfigured) return socialPosts
    const snap = await getDocs(query(colRef('social_posts'), orderBy('createdAt', 'desc')))
    return snap.docs.map(d => ({ ...d.data(), id: d.id }))
  },

  // Echtzeit-Listener für Live-Updates
  subscribe(callback) {
    if (!isFirebaseConfigured) {
      callback(socialPosts)
      return () => {}
    }
    const q = query(colRef('social_posts'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ ...d.data(), id: d.id })))
    })
  },

  // Neuen Post erstellen
  async create(postData) {
    if (!isFirebaseConfigured) throw new Error('Firebase nicht konfiguriert')
    // eslint-disable-next-line no-unused-vars
    const { id, ...data } = postData
    const ref = await addDoc(colRef('social_posts'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  },

  // Post aktualisieren (z.B. Stage-Wechsel, Kommentar hinzufügen)
  async update(id, updates) {
    if (!isFirebaseConfigured) throw new Error('Firebase nicht konfiguriert')
    await updateDoc(docRef('social_posts', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  },

  // Stage (Workflow-Schritt 0-5) weiterschalten
  async updateStage(id, stage, status) {
    return this.update(id, { stage, status })
  },

  // Kommentar hinzufügen
  async addComment(id, currentComments, newComment) {
    return this.update(id, {
      comments: [...currentComments, { ...newComment, date: new Date().toISOString() }],
    })
  },

  async delete(id) {
    if (!isFirebaseConfigured) throw new Error('Firebase nicht konfiguriert')
    await deleteDoc(docRef('social_posts', id))
  },
}

// ─── SEO Artikel ──────────────────────────────────────────────────────────────

export const seoArticlesService = {
  async getAll() {
    if (!isFirebaseConfigured) return seoArticles
    const snap = await getDocs(query(colRef('seo_articles'), orderBy('lastModified', 'desc')))
    return snap.docs.map(d => ({ ...d.data(), id: d.id }))
  },

  async getById(id) {
    if (!isFirebaseConfigured) return seoArticles.find(a => a.id === id) || null
    const snap = await getDoc(docRef('seo_articles', id))
    return snap.exists() ? { ...snap.data(), id: snap.id } : null
  },

  subscribe(callback) {
    if (!isFirebaseConfigured) {
      callback(seoArticles)
      return () => {}
    }
    const q = query(colRef('seo_articles'), orderBy('lastModified', 'desc'))
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ ...d.data(), id: d.id })))
    })
  },

  async create(articleData) {
    if (!isFirebaseConfigured) throw new Error('Firebase nicht konfiguriert')
    // eslint-disable-next-line no-unused-vars
    const { id, ...data } = articleData
    const ref = await addDoc(colRef('seo_articles'), {
      ...data,
      score: 0,
      lastModified: serverTimestamp(),
      createdAt: serverTimestamp(),
    })
    return ref.id
  },

  async update(id, updates) {
    if (!isFirebaseConfigured) throw new Error('Firebase nicht konfiguriert')
    await updateDoc(docRef('seo_articles', id), {
      ...updates,
      lastModified: serverTimestamp(),
    })
  },

  async delete(id) {
    if (!isFirebaseConfigured) throw new Error('Firebase nicht konfiguriert')
    await deleteDoc(docRef('seo_articles', id))
  },
}

// ─── Seed-Funktion: Mock-Daten in Firestore importieren ──────────────────────

export async function seedFirestore() {
  if (!isFirebaseConfigured) {
    console.warn('Firebase nicht konfiguriert – Seed übersprungen.')
    return
  }

  console.log('Seeding Firestore mit Mock-Daten...')

  for (const post of socialPosts) {
    const { id, ...data } = post
    await addDoc(colRef('social_posts'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  for (const article of seoArticles) {
    const { id, ...data } = article
    await addDoc(colRef('seo_articles'), {
      ...data,
      createdAt: serverTimestamp(),
    })
  }

  console.log('Seeding abgeschlossen.')
}
