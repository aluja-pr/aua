import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  addDoc,
  Timestamp
} from 'firebase/firestore';

// Note: In a real scenario, these would come from firebase-applet-config.json
// Since the tool failed, we'll use placeholders that the user will need to fill
// OR we can try to use environment variables if they were set.
// For now, I'll provide the structure and a warning.

const firebaseConfig = {
  apiKey: "AIzaSyA9GkfwoT3lUSPsUafvtk8Mb4Q5NNqAjzU",
  authDomain: "ai-studio-applet-webapp-16293.firebaseapp.com",
  projectId: "ai-studio-applet-webapp-16293",
  storageBucket: "ai-studio-applet-webapp-16293.firebasestorage.app",
  messagingSenderId: "921089173440",
  appId: "1:921089173440:web:571de32637d9f1eb878a25"
};

const app = initializeApp(firebaseConfig);
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
