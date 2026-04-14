import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// CONFIGURACIÓN SEGURA (Usa variables de entorno de Vercel/Vite)
// He añadido valores por defecto para que funcione aquí en el editor (Local)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA9GkfwoT3lUSPsUafvtk8Mb4Q5NNqAjzU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ai-studio-applet-webapp-16293.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ai-studio-applet-webapp-16293",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ai-studio-applet-webapp-16293.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "921089173440",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:921089173440:web:571de32637d9f1eb878a25"
};

// Log de control para ver en la consola si las llaves están cargando
console.log("🚀 Firebase: Inicializando con API Key:", firebaseConfig.apiKey ? "PRESENTE" : "FALTANTE");

let app;
try {
  if (!firebaseConfig.apiKey) {
    throw new Error("Falta la API Key de Firebase. Configura VITE_FIREBASE_API_KEY en Vercel.");
  }
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error("❌ Error inicializando Firebase:", error);
  // Creamos una app "dummy" para evitar que los exports fallen catastróficamente
  app = getApps().length ? getApp() : initializeApp({ apiKey: "dummy", projectId: "dummy" });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Error handling helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
