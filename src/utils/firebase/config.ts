import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

type FirebaseEnvKey =
  | "VITE_FIREBASE_API_KEY"
  | "VITE_FIREBASE_AUTH_DOMAIN"
  | "VITE_FIREBASE_DATABASE_URL"
  | "VITE_FIREBASE_PROJECT_ID"
  | "VITE_FIREBASE_STORAGE_BUCKET"
  | "VITE_FIREBASE_MESSAGING_SENDER_ID"
  | "VITE_FIREBASE_APP_ID";

const requiredEnvKeys: FirebaseEnvKey[] = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_DATABASE_URL",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

function getRequiredEnv(key: FirebaseEnvKey): string {
  const value = import.meta.env[key];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `Missing Firebase environment variable: ${key}. ` +
        "Create a .env file based on .env.example and restart the Vite server."
    );
  }

  return value.trim();
}

function validateFirebaseEnvironment() {
  const missingKeys = requiredEnvKeys.filter((key) => {
    const value = import.meta.env[key];
    return typeof value !== "string" || value.trim() === "";
  });

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missingKeys.join(", ")}. ` +
        "Create a .env file based on .env.example and restart the Vite server."
    );
  }
}

validateFirebaseEnvironment();

const firebaseConfig = {
  apiKey: getRequiredEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getRequiredEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  databaseURL: getRequiredEnv("VITE_FIREBASE_DATABASE_URL"),
  projectId: getRequiredEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getRequiredEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getRequiredEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getRequiredEnv("VITE_FIREBASE_APP_ID"),
};

// Initialize Firebase using a singleton pattern to avoid duplicate app errors
// during Vite hot reloads and React development mode.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);