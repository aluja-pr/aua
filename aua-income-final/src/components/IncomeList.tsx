import * as React from 'react';
import { Trash2, TrendingUp, Filter, ArrowUpRight, ArrowDownRight, ReceiptText } from 'lucide-react';
import { Transaction, CategoryDefinition } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToCategories } from '@/src/lib/storage';
import { auth } from '@/src/lib/firebase';
import { cn } from '@/src/lib/utils';

interface IncomeListProps {
  entries: Transaction[];
  onDelete: (id: string) => void;
}

export function IncomeList({ entries, onDelete }: IncomeListProps) {
  const [filterCategoryId, setFilterCategoryId] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categories, setCategories] = React.useState<CategoryDefinition[]>([]);

  React.useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const unsubscribe = subscribeToCategories(user.uid, (cats) => {
        setCategories(cats);
      });
      return () => unsubscribe();
    }
  }, []);

  const filteredEntries = entries.filter(e => {
    const matchesCategory = filterCategoryId === 'all' || e.categoryId === filterCategoryId;
    const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (getCategory(e.categoryId)?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategory = (id: string) => categories.find(c => c.id === id);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <div className="bg-gray-50 p-6 rounded-[32px] mb-6 shadow-inner">
          <ReceiptText className="h-12 w-12 text-gray-200" />
        </div>
        <p className="text-xl font-bold text-gray-900">Historial vacío</p>
        <p className="text-sm font-medium mt-1">Tus transacciones aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 px-2">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black tracking-tight text-gray-900">Actividad</h3>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar transacción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 bg-gray-100 border-none rounded-2xl pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all placeholder:text-gray-400"
            />
          </div>
          
          <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
            <SelectTrigger className="h-12 w-full sm:w-[160px] border-none bg-gray-100 rounded-2xl text-xs font-bold px-4">
              <span className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-gray-400" />
                <SelectValue placeholder="Filtrar" />
              </span>
            </SelectTrigger>
            <SelectContent className="rounded-[24px] border-none shadow-2xl p-2">
              <SelectItem value="all" className="rounded-xl font-bold">Todas</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="rounded-xl font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="h-[600px] pr-4 custom-scrollbar">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {filteredEntries.map((entry) => {
              const cat = getCategory(entry.categoryId);
              const isIncome = entry.type === 'income';
              
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  layout
                >
                  <Card className="apple-card border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div 
                          className={cn(
                            "p-4 rounded-[20px] transition-transform group-hover:scale-110",
                            isIncome ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"
                          )}
                        >
                          {isIncome ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 leading-tight truncate max-w-[120px] sm:max-w-[200px]">
                            {entry.description || cat?.name || 'Transacción'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                              {new Date(entry.date).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                            {cat && (
                              <Badge 
                                variant="secondary" 
                                className="text-[9px] font-black px-2 py-0.5 rounded-full border-none"
                                style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                              >
                                <span className="truncate max-w-[80px] sm:max-w-[120px]">{cat.name}</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                        <span className={cn(
                          "text-lg sm:text-xl font-black tracking-tighter truncate",
                          isIncome ? "text-green-600" : "text-red-600"
                        )}>
                          {isIncome ? '+' : '-'}{entry.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(entry.id)}
                          className="opacity-0 group-hover:opacity-100 transition-all text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full h-10 w-10 shrink-0"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filteredEntries.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 font-bold">No hay transacciones en este filtro</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
