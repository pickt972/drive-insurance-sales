import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Fallback configuration for development
const getEnvVar = (key: string, fallback: string = '') => {
  const value = import.meta.env[key];
  if (!value && !fallback) {
    console.warn(`Missing environment variable: ${key}`);
  }
  return value || fallback;
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'demo-api-key'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'demo-project.firebaseapp.com'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'demo-project'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'demo-project.appspot.com'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', '1:123456789:web:abcdef')
};

// Initialize Firebase with error handling
let app;
let auth;
let db;
let storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error('Firebase initialization failed:', error);
  console.log('Please check your Firebase configuration in the .env file');
  
  // Create mock objects to prevent app crashes
  auth = null;
  db = null;
  storage = null;
}

// Connect to emulators in development
if (import.meta.env.DEV && auth && db && storage) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    console.log('Firebase emulators already connected or not available');
  }
}

export { auth, db, storage };
export default app;