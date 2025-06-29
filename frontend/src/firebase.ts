// src/firebase.ts
import { initializeApp, FirebaseOptions, FirebaseApp } from 'firebase/app'
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth'
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions'
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage'
import { env, isLocalEmulator } from './config/environment'
import { logInfo, logWarn } from './services/LoggingService'

const firebaseConfig: FirebaseOptions = {
  apiKey:            env.firebase.apiKey,
  authDomain:        env.firebase.authDomain,
  projectId:         env.firebase.projectId,
  storageBucket:     env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId:             env.firebase.appId,
  measurementId:     env.firebase.measurementId,
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
export const functions: Functions = getFunctions(app, env.cloudFunctions.region)

// Connect to emulators in development if using local endpoint
if (isLocalEmulator) {
  logInfo('Connecting to Firebase emulators');
  
  // Prepare connection details
  const authUrl = new URL(env.firebaseAuth.endpoint);
  const storageUrl = new URL(env.firebaseStorage.endpoint);
  const functionsUrl = new URL(env.cloudFunctions.endpoint);
  
  logInfo('Attempting to connect to emulators', {
    auth: {
      endpoint: env.firebaseAuth.endpoint,
      host: authUrl.host
    },
    firestore: {
      endpoint: 'localhost:8080'
    },
    storage: {
      endpoint: env.firebaseStorage.endpoint,
      hostname: storageUrl.hostname,
      port: storageUrl.port
    },
    functions: {
      endpoint: env.cloudFunctions.endpoint,
      hostname: functionsUrl.hostname,
      port: functionsUrl.port,
      region: env.cloudFunctions.region
    }
  });
  
  try {
    // Connect to Auth emulator
    connectAuthEmulator(auth, authUrl.toString());
    logInfo('Connected to Auth emulator', { endpoint: env.firebaseAuth.endpoint });
    
    // Connect to Firestore emulator (default port 8080)
    connectFirestoreEmulator(firestore, 'localhost', 8080);
    logInfo('Connected to Firestore emulator', { endpoint: 'localhost:8080' });
    
    // Connect to Storage emulator
    connectStorageEmulator(storage, storageUrl.hostname, parseInt(storageUrl.port));
    logInfo('Connected to Storage emulator', { endpoint: env.firebaseStorage.endpoint });
    
    // Connect to Functions emulator
    connectFunctionsEmulator(functions, functionsUrl.hostname, parseInt(functionsUrl.port));
    logInfo('Connected to Functions emulator', { endpoint: env.cloudFunctions.endpoint, region: env.cloudFunctions.region });
    
  } catch (error) {
    logWarn('Some emulators may already be connected', { error });
  }
}
