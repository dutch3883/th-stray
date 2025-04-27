import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDDDdTsl2gWdWaUMlnKkVRhzQhDxGbfA_w",
  authDomain: "th-stray.firebaseapp.com",
  projectId: "th-stray",
  storageBucket: "th-stray.firebasestorage.app",
  messagingSenderId: "334635767532",
  appId: "1:334635767532:web:5ff19fc9bd49809c3f37c9",
  measurementId: "G-RYRHXB6X9T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export {app, auth, analytics};