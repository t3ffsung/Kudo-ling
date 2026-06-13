import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAn3L-5iBHJZSIRWAtBFzYUXo7D0rjuSWM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "kudo-ling.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://kudo-ling-default-rtdb.firebaseio.com",
  projectId: "kudo-ling",
  storageBucket: "kudo-ling.firebasestorage.app",
  messagingSenderId: "288395243785",
  appId: "1:288395243785:web:28fb0394fed38f7d2763d8",
  measurementId: "G-6JBZH13DDB"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();