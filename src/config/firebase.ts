import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
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

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

// Initialize Analytics (only in browser)
let analytics: any = null
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app)
}

export { analytics }
export default app

