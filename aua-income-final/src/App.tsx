/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { LayoutGrid, List, User as UserIcon, LogOut, LogIn, Wallet, Plus, Sparkles } from 'lucide-react';
import { Transaction } from './types';
import { 
  saveTransaction, 
  deleteTransaction, 
  subscribeToTransactions,
  initializeDefaultCategories
} from './lib/storage';
import { auth, googleProvider } from './lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Dashboard } from './components/Dashboard';
import { IncomeList } from './components/IncomeList';
import { IncomeForm } from './components/IncomeForm';
import { Logo } from './components/Logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

export default function App() {
  const [entries, setEntries] = React.useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
        if (user) {
          initializeDefaultCategories().catch(err => {
            console.error("Error initializing categories:", err);
          });
        }
      }, (err) => {
        console.error("Auth state change error:", err);
        setError(err.message);
        setLoading(false);
      });
      return () => unsubscribeAuth();
    } catch (err) {
      console.error("Firebase Auth initialization failed:", err);
      setError(err instanceof Error ? err.message : "Error al inicializar Firebase");
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      const unsubscribeEntries = subscribeToTransactions(user.uid, (newEntries) => {
        setEntries(newEntries);
      });
      return () => unsubscribeEntries();
    } else {
      setEntries([]);
    }
  }, [user]);

  const handleAddEntry = async (entry: Transaction) => {
    await saveTransaction(entry);
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteTransaction(id);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] p-6">
        <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <Wallet className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Error de Conexión</h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            No hemos podido conectar con el servidor. Esto suele pasar si el dominio no está autorizado en Firebase.
          </p>
          <div className="p-4 bg-gray-50 rounded-2xl text-left">
            <p className="text-[10px] font-mono text-gray-400 break-all">{error}</p>
          </div>
          <Button 
            onClick={() => window.location.reload()}
            className="w-full h-14 bg-black text-white font-black rounded-2xl"
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="flex flex-col items-center gap-12"
        >
          <Logo className="w-72 h-auto text-black" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-black tracking-tighter text-gray-900">AUA INCOME</span>
            <div className="w-12 h-1 bg-gradient-to-r from-[#007AFF] to-[#AF52DE] rounded-full mt-2 animate-pulse" />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full bg-[#000000] text-white selection:bg-[#AF52DE]/30 overflow-hidden relative flex flex-col items-center justify-center">
        {/* Cinematic Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[#AF52DE]/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-[#007AFF]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
        </div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center gap-16 px-6"
        >
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative"
          >
            <div className="absolute -inset-12 bg-[#AF52DE] rounded-full blur-[80px] opacity-20 animate-pulse" />
            <Logo className="w-80 h-auto text-white relative z-10" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-col items-center gap-8"
          >
            <Button 
              onClick={handleLogin}
              className="group relative px-12 h-20 bg-white hover:bg-gray-100 text-black text-xl font-black rounded-[24px] shadow-[0_20px_40px_rgba(175,82,222,0.15)] transition-all hover:scale-[1.05] active:scale-[0.95] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#AF52DE]/20 to-[#007AFF]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-center gap-4">
                <LogIn className="h-6 w-6" />
                Empezar Ahora
              </div>
            </Button>

            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.6em] animate-pulse">
              Neural Finance Ecosystem
            </p>
          </motion.div>
        </motion.div>

        {/* Minimal Footer */}
        <div className="absolute bottom-12 left-0 right-0 text-center z-10">
          <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.4em]">
            © 2026 AUA INCOME • Designed for Performance
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-24 md:pb-8 selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-3xl px-4 sm:px-8 py-4 flex items-center justify-between border-b border-white/20 shadow-[0_1px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-4">
          <Logo className="h-10 w-auto text-black transition-transform group-hover:scale-105 duration-500" />
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex flex-col items-end justify-center">
            <p className="text-[10px] sm:text-[11px] font-black text-black tracking-tight leading-none mb-1">{user.displayName?.split(' ')[0]}</p>
            <button 
              onClick={handleLogout} 
              className="group flex items-center gap-1.5 py-1.5 px-2 -mr-2 text-[10px] text-red-500 font-black uppercase tracking-widest hover:bg-red-50 rounded-lg transition-all active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Cerrar Sesión</span>
            </button>
          </div>
          <div className="relative shrink-0">
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-[#007AFF] to-[#AF52DE] rounded-full blur-[2px] opacity-40"></div>
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden border-2 border-white shadow-2xl">
              <img src={user.photoURL || ''} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="dashboard" className="mt-0 outline-none">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <Dashboard entries={entries} />
            </motion.div>
          </TabsContent>

          <TabsContent value="list" className="mt-0 outline-none">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <IncomeList entries={entries} onDelete={handleDeleteEntry} />
            </motion.div>
          </TabsContent>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-gray-100 px-8 py-4 md:relative md:bg-transparent md:border-none md:mt-12 md:px-0 z-30">
            <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto bg-gray-200/40 rounded-[24px] p-1.5 h-16 shadow-inner">
              <TabsTrigger 
                value="dashboard" 
                className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-[#007AFF] flex items-center justify-center gap-3 transition-all font-bold text-gray-500"
              >
                <LayoutGrid className="h-5 w-5" />
                <span className="text-sm">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="list" 
                className="rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-[#007AFF] flex items-center justify-center gap-3 transition-all font-bold text-gray-500"
              >
                <List className="h-5 w-5" />
                <span className="text-sm">Actividad</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </main>

      <IncomeForm onAdd={handleAddEntry} />
      
      {/* Decorative background elements */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#007AFF]/5 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF2D55]/5 rounded-full blur-[120px] -z-10" />
    </div>
  );
}

