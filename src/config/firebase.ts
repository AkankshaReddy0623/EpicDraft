import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"
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
  
  // Enable offline persistence for better performance and offline support
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err: any) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.')
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support all of the features required for persistence')
      } else {
        console.warn('Persistence error:', err)
      }
    })
  }
  
  console.log('Firebase initialized successfully')
} catch (error) {
  console.error('Firebase initialization error:', error)
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
