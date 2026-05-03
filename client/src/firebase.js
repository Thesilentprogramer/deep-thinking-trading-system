import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCtem2jYh2WuXmRQjDddwM3wqa8WkVJeAA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "deep-thinking-trading.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "deep-thinking-trading",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "deep-thinking-trading.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1049367827602",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1049367827602:web:b48ac09aea82461495824b",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const messaging = getMessaging(app);

export default app;
