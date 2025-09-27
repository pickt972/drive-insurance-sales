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
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID')
};

// Vérifier si Firebase est configuré
const isFirebaseConfigured = Object.values(firebaseConfig).every(value => value && value !== '');

// Initialize Firebase with error handling
let app;
let auth;
let db;
let storage;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('✅ Firebase initialisé avec succès');
  } catch (error) {
    console.error('❌ Échec de l\'initialisation Firebase:', error);
    auth = null;
    db = null;
    storage = null;
  }
} else {
  console.warn('⚠️ Configuration Firebase manquante - Mode démonstration activé');
  auth = null;
  db = null;
  storage = null;
}

export { auth, db, storage, isFirebaseConfigured };
export default app;