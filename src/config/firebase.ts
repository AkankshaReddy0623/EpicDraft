import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore'
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyDyT2y509GNj4yPvtu21PEst16D3qJhGJw",
  authDomain: "epicdraft-8e20e.firebaseapp.com",
  projectId: "epicdraft-8e20e",
  storageBucket: "epicdraft-8e20e.firebasestorage.app",
  messagingSenderId: "362839734789",
  appId: "1:362839734789:web:4d37a5eb580131773cfa6c",
  measurementId: "G-CMX8PEXG5N"
}

// Initialize Firebase with error handling
let app
let auth
let db
let googleProvider

try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  googleProvider = new GoogleAuthProvider()
  
  // Set auth persistence to LOCAL (survives browser restarts)
  if (typeof window !== 'undefined' && auth) {
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('✅ Auth persistence enabled (LOCAL)')
      })
      .catch((err: any) => {
        console.warn('⚠️ Auth persistence warning:', err.message || err)
      })
  }
  
  // Enable offline persistence with improved error handling
  if (typeof window !== 'undefined') {
    // Try multi-tab first for better UX
    enableMultiTabIndexedDbPersistence(db)
      .then(() => {
        console.log('✅ Offline persistence enabled (multi-tab)')
      })
      .catch((err: any) => {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open - this is OK, data will still sync
          console.log('ℹ️ Multiple tabs detected - persistence already enabled')
        } else if (err.code === 'unimplemented') {
          console.warn('⚠️ Browser does not support offline persistence')
        } else {
          console.warn('⚠️ Persistence setup warning:', err.message || err)
        }
        // Don't retry - let Firestore handle it automatically
      })
  }
  
  console.log('✅ Firebase initialized successfully')
} catch (error) {
  console.error('❌ Firebase initialization error:', error)
  // Create minimal fallback objects to prevent crashes
  app = {} as any
  auth = {} as any
  db = {} as any
  googleProvider = {} as any
}

// Initialize services
export { auth, db, googleProvider }

// Initialize Analytics (only in browser)
let analytics: any = null
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app)
  } catch (error) {
    console.warn('Analytics initialization failed:', error)
  }
}

export { analytics }
export default app
