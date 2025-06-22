// src/firebase.ts
import { initializeApp, FirebaseOptions, FirebaseApp } from 'firebase/app'
import { getAuth, Auth }                             from 'firebase/auth'
import { getFunctions, Functions }                   from 'firebase/functions'
import { getFirestore, Firestore }                   from 'firebase/firestore'
import { getStorage, FirebaseStorage }               from 'firebase/storage'

const firebaseConfig: FirebaseOptions = {
  apiKey:            "AIzaSyDDDdTsl2gWdWaUMlnKkVRhzQhDxGbfA_w",
  authDomain:        "th-stray.firebaseapp.com",
  projectId:         "th-stray",
  storageBucket:     "th-stray.firebasestorage.app",
  messagingSenderId: "334635767532",
  appId:             "1:334635767532:web:5ff19fc9bd49809c3f37c9",
  measurementId:     "G-RYRHXB6X9T",
}
 
// Initialize App
export const app: FirebaseApp = initializeApp(firebaseConfig)

// Initialize Auth
export const auth: Auth = getAuth(app)

// Initialize Firestore
export const firestore: Firestore = getFirestore(app)

// Initialize Storage
export const storage: FirebaseStorage = getStorage(app)

// Initialize Functions (optionally with a custom host from env)
const host = import.meta.env.VITE_CLOUD_FUNCTION_ENDPOINTS as string | undefined
export const functions: Functions = host
  ? getFunctions(app, host.startsWith('http') ? host : `https://${host}`)
  : getFunctions(app, 'asia-northeast1')
