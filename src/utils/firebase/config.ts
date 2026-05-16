import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCCiuqNP0b3Gg2DZO40DfG6F4wol-PPUOA",
  authDomain: "sahgil-garden-system.firebaseapp.com",
  databaseURL: "https://sahgil-garden-system-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sahgil-garden-system",
  storageBucket: "sahgil-garden-system.firebasestorage.app",
  messagingSenderId: "106742551297",
  appId: "1:106742551297:web:4790229b45bd7433e50100"
};
// Initialize Firebase (singleton pattern to prevent duplicate app error)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// NOTE: Get your config from Firebase Console > Project Settings > Web SDK config

