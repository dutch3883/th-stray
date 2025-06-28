// src/firebase.ts
import { initializeApp, FirebaseOptions, FirebaseApp } from 'firebase/app'
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth'
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions'
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage'
import { env, isLocalEmulator } from './config/environment'

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

// Initialize Functions with environment-based configuration
export const functions: Functions = getFunctions(app, env.cloudFunctions.endpoint)

// Connect to emulators in development if using local endpoint
if (isLocalEmulator) {
  console.log('🔧 Connecting to Firebase emulators...');
  
  try {
    // Connect to Auth emulator
    connectAuthEmulator(auth, env.firebaseAuth.endpoint.replace('http://', ''));
    console.log('✅ Connected to Auth emulator');
    
    // Connect to Firestore emulator (default port 8080)
    connectFirestoreEmulator(firestore, 'localhost', 8080);
    console.log('✅ Connected to Firestore emulator');
    
    // Connect to Storage emulator
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('✅ Connected to Storage emulator');
    
    // Connect to Functions emulator
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('✅ Connected to Functions emulator');
    
  } catch (error) {
    console.warn('⚠️ Some emulators may already be connected:', error);
  }
}
