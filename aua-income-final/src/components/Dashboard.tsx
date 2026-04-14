import * as React from 'react';
import { TrendingUp, Wallet, PieChart as PieChartIcon, Calendar, ArrowUpRight, ArrowDownRight, Sparkles, Target, ChevronRight } from 'lucide-react';
import { Transaction, CategoryDefinition, TransactionType } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { subscribeToCategories } from '@/src/lib/storage';
import { auth } from '@/src/lib/firebase';
import { getFinancialInsights } from '@/src/services/aiService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface DashboardProps {
  entries: Transaction[];
}

interface AIInsight {
  title: string;
  description: string;
}

export function Dashboard({ entries }: DashboardProps) {
  const [categories, setCategories] = React.useState<CategoryDefinition[]>([]);
  const [aiInsights, setAiInsights] = React.useState<AIInsight[]>([]);
  const [loadingAI, setLoadingAI] = React.useState(false);
  const [distType, setDistType] = React.useState<TransactionType>('expense');

  React.useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const unsubscribe = subscribeToCategories(user.uid, (cats) => {
        setCategories(cats);
      });
      return () => unsubscribe();
    }
  }, []);

  const totalIncome = entries
    .filter(e => e.type === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0);
  
  const totalExpenses = entries
    .filter(e => e.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const balance = totalIncome - totalExpenses;
  
  const categoryData = entries.reduce((acc, entry) => {
    acc[entry.categoryId] = (acc[entry.categoryId] || 0) + entry.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryData).reduce((acc, [categoryId, value]) => {
    const cat = categories.find(c => c.id === categoryId);
    const name = cat?.name || 'Otro';
    const type = cat?.type || (entries.find(e => e.categoryId === categoryId)?.type || 'income');
    
    const existing = acc.find(item => item.name === name && item.type === type);
    if (existing) {
      existing.value += value;
    } else {
      acc.push({
        name,
        value,
        color: cat?.color || '#999',
        type,
        budget: cat?.budget,
        id: categoryId
      });
    }
    return acc;
  }, [] as any[]);

  // Monthly aggregation for Income vs Expenses
  const monthlyData = entries.reduce((acc, entry) => {
    const date = new Date(entry.date);
    const month = date.toLocaleString('es-ES', { month: 'short' });
    const year = date.getFullYear();
    const key = `${month} ${year}`;
    
    if (!acc[key]) acc[key] = { month: key, income: 0, expense: 0, timestamp: date.getTime() };
    
    if (entry.type === 'income') {
      acc[key].income += entry.amount;
    } else {
      acc[key].expense += entry.amount;
    }
    return acc;
  }, {} as Record<string, { month: string; income: number; expense: number; timestamp: number }>);

  const barData = Object.values(monthlyData)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-6);

  const handleGenerateInsights = async () => {
    setLoadingAI(true);
    const insights = await getFinancialInsights(entries, categories);
    setAiInsights(insights);
    setLoadingAI(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-8">
      {/* Main Balance Card - Bento Large */}
      <Card className="md:col-span-4 apple-card bg-gradient-to-br from-[#000000] to-[#1c1c1e] text-white shadow-2xl border-none overflow-hidden relative min-h-[240px]">
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-[#007AFF]/20 rounded-full blur-[100px]" />
        <CardContent className="p-6 sm:p-10 relative z-10 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Patrimonio Neto</span>
              <div className="p-2 bg-white/5 rounded-xl backdrop-blur-md border border-white/10">
                <Wallet className="h-5 w-5 text-[#007AFF]" />
              </div>
            </div>
            <div className="overflow-hidden">
              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter mb-8 truncate">
                {balance.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </h2>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 sm:gap-12 pt-8 border-t border-white/10">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 text-green-400 text-[9px] font-black uppercase tracking-widest">
                <ArrowUpRight className="h-3 w-3" /> Ingresos
              </div>
              <p className="text-xl sm:text-2xl font-black truncate">
                {totalIncome.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 text-red-400 text-[9px] font-black uppercase tracking-widest">
                <ArrowDownRight className="h-3 w-3" /> Gastos
              </div>
              <p className="text-xl sm:text-2xl font-black truncate">
                {totalExpenses.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights - Bento Medium */}
      <Card className="md:col-span-2 apple-card border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest">
            <Sparkles className="h-4 w-4 text-[#AF52DE]" /> Insights IA
          </CardTitle>
          <button 
            onClick={handleGenerateInsights}
            disabled={loadingAI}
            className="text-[10px] font-black text-[#007AFF] uppercase tracking-widest hover:opacity-70 transition-opacity disabled:opacity-30"
          >
            {loadingAI ? 'Analizando...' : 'Actualizar'}
          </button>
        </CardHeader>
        <CardContent className="space-y-4 min-h-[180px]">
          {Array.isArray(aiInsights) && aiInsights.length > 0 ? (
            <div className="space-y-3">
              {aiInsights.map((insight, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 bg-purple-50 rounded-2xl border border-purple-100"
                >
                  <p className="text-[11px] font-black text-purple-700 uppercase mb-1">{insight.title}</p>
                  <p className="text-xs font-medium text-purple-900 leading-tight">{insight.description}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-3">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-purple-300" />
              </div>
              <p className="text-xs font-bold text-gray-400 max-w-[200px]">Pulsa actualizar para que la IA analice tus finanzas.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribution Chart - Bento Medium */}
      <Card className="md:col-span-2 apple-card border-none shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest">
            <PieChartIcon className="h-4 w-4 text-[#007AFF]" /> Distribución
          </CardTitle>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setDistType('income')}
              className={cn(
                "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                distType === 'income' ? "bg-white text-[#007AFF] shadow-sm" : "text-gray-400"
              )}
            >
              Ingresos
            </button>
            <button 
              onClick={() => setDistType('expense')}
              className={cn(
                "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                distType === 'expense' ? "bg-white text-[#FF3B30] shadow-sm" : "text-gray-400"
              )}
            >
              Gastos
            </button>
          </div>
        </CardHeader>
        <CardContent className="h-[200px]">
          {pieData.filter(d => d.type === distType).length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.filter(d => d.type === distType)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.filter(d => d.type === distType).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', padding: '12px' }}
                  formatter={(value: number) => [`€${value.toLocaleString()}`, 'Total']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300 text-xs font-bold italic">
              Sin {distType === 'income' ? 'ingresos' : 'gastos'} registrados
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Tracking - Bento Medium */}
      <Card className="md:col-span-2 apple-card border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest">
            <Target className="h-4 w-4 text-[#FF9500]" /> Presupuestos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {categories.filter(c => c.budget && c.type === 'expense').length > 0 ? (
            categories
              .filter(c => c.budget && c.type === 'expense')
              .map((cat) => {
                const spent = categoryData[cat.id] || 0;
                const percentage = Math.min((spent / (cat.budget || 1)) * 100, 100);
                const isOver = spent > (cat.budget || 0);
                
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex justify-between items-end gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-gray-900 truncate">{cat.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          {spent.toLocaleString()} / {cat.budget?.toLocaleString()} €
                        </p>
                      </div>
                      <span className={cn(
                        "text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0",
                        isOver ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"
                      )}>
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={cn(
                          "h-full rounded-full",
                          isOver ? "bg-red-500" : ""
                        )}
                        style={{ backgroundColor: isOver ? undefined : cat.color }}
                      />
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="text-center py-12">
              <p className="text-[11px] font-bold text-gray-400 max-w-[180px] mx-auto">Configura presupuestos en tus categorías para ver el progreso.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Categories Summary - Bento Medium */}
      <Card className="md:col-span-2 apple-card border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-black text-gray-900 uppercase tracking-widest">Categorías Top</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {pieData
            .sort((a, b) => b.value - a.value)
            .slice(0, 6)
            .map((item) => {
              const total = item.type === 'income' ? totalIncome : totalExpenses;
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <div key={`${item.name}-${item.type}`} className="flex items-center justify-between group gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-gray-800 truncate">{item.name}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight truncate">
                        {item.type === 'income' ? 'Ingreso' : 'Gasto'} • {percentage.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] font-black text-gray-900 shrink-0 tabular-nums">
                    {item.value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
              );
            })}
          {pieData.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-xs font-bold">No hay actividad</p>
          )}
        </CardContent>
      </Card>

      {/* Evolution Chart - Bento Full */}
      <Card className="md:col-span-4 apple-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest">
            <Calendar className="h-4 w-4 text-[#007AFF]" /> Evolución Mensual
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] pl-0">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#999' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#999' }}
                  tickFormatter={(value) => `€${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8f8f8' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 15px 40px rgba(0,0,0,0.12)', padding: '16px' }}
                />
                <Bar 
                  name="Ingresos"
                  dataKey="income" 
                  fill="#007AFF" 
                  radius={[10, 10, 0, 0]} 
                  barSize={24}
                />
                <Bar 
                  name="Gastos"
                  dataKey="expense" 
                  fill="#FF3B30" 
                  radius={[10, 10, 0, 0]} 
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300 italic text-xs font-bold">
              Registra transacciones para ver tu evolución financiera
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
