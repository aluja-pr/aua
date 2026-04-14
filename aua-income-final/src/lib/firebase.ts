import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// CONFIGURACIÓN DIRECTA (Sin depender de variables de entorno para asegurar que cargue)
const firebaseConfig = {
  apiKey: "AIzaSyA9GkfwoT3lUSPsUafvtk8Mb4Q5NNqAjzU",
  authDomain: "ai-studio-applet-webapp-16293.firebaseapp.com",
  projectId: "ai-studio-applet-webapp-16293",
  storageBucket: "ai-studio-applet-webapp-16293.firebasestorage.app",
  messagingSenderId: "921089173440",
  appId: "1:921089173440:web:571de32637d9f1eb878a25"
};

// Log de control para ver en la consola si las llaves están cargando
console.log("🚀 Firebase: Inicializando con API Key:", firebaseConfig.apiKey ? "PRESENTE" : "FALTANTE");

let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error("❌ Error inicializando Firebase:", error);
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
