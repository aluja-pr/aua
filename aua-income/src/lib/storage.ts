import { Transaction, CategoryDefinition } from '../types';
import { 
  db, 
  auth, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  getDocs
} from 'firebase/firestore';

const STORAGE_KEY = 'aua_income_data';
const CATEGORIES_KEY = 'aua_income_categories';

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { id: '1', name: 'Salario', color: '#007AFF', type: 'income' },
  { id: '2', name: 'Freelance', color: '#5856D6', type: 'income' },
  { id: '3', name: 'Inversión', color: '#34C759', type: 'income' },
  { id: '4', name: 'Regalo', color: '#FF2D55', type: 'income' },
  { id: '5', name: 'Otros', color: '#FF9500', type: 'income' },
  { id: '6', name: 'Alquiler', color: '#FF3B30', type: 'expense' },
  { id: '7', name: 'Comida', color: '#FF9500', type: 'expense' },
  { id: '8', name: 'Transporte', color: '#5AC8FA', type: 'expense' },
  { id: '9', name: 'Ocio', color: '#AF52DE', type: 'expense' },
  { id: '10', name: 'Suscripciones', color: '#5856D6', type: 'expense' },
];

// Firebase Operations
export const subscribeToTransactions = (userId: string, callback: (transactions: Transaction[]) => void) => {
  const path = `users/${userId}/transactions`;
  const q = query(collection(db, path), orderBy('date', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => doc.data() as Transaction);
    callback(transactions);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const subscribeToCategories = (userId: string, callback: (categories: CategoryDefinition[]) => void) => {
  const path = `users/${userId}/categories`;
  const q = collection(db, path);
  
  return onSnapshot(q, (snapshot) => {
    const categories = snapshot.docs.map(doc => doc.data() as CategoryDefinition);
    if (categories.length === 0) {
      callback(DEFAULT_CATEGORIES);
    } else {
      // Merge default categories with user categories if needed, or just return user ones
      callback(categories);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const saveTransaction = async (transaction: Transaction) => {
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/transactions`;
  try {
    await setDoc(doc(db, path, transaction.id), { ...transaction, userId: user.uid });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${transaction.id}`);
  }
};

export const deleteTransaction = async (id: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/transactions`;
  try {
    await deleteDoc(doc(db, path, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
};

export const saveCategory = async (category: CategoryDefinition) => {
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/categories`;
  try {
    await setDoc(doc(db, path, category.id), { ...category, userId: user.uid });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${category.id}`);
  }
};

export const deleteCategory = async (id: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/categories`;
  try {
    await deleteDoc(doc(db, path, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
};

export const initializeDefaultCategories = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/categories`;
  try {
    const snapshot = await getDocs(collection(db, path));
    if (snapshot.empty) {
      for (const cat of DEFAULT_CATEGORIES) {
        await saveCategory({ ...cat, userId: user.uid });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};
