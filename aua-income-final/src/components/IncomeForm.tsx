import * as React from 'react';
import { Plus, X, Palette, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CategoryDefinition, Transaction, TransactionType } from '../types';
import { subscribeToCategories, saveCategory, deleteCategory, DEFAULT_CATEGORIES } from '@/src/lib/storage';
import { auth } from '@/src/lib/firebase';
import { cn } from '@/src/lib/utils';

interface IncomeFormProps {
  onAdd: (entry: Transaction) => void;
}

const COLORS = ['#007AFF', '#5856D6', '#34C759', '#FF2D55', '#FF9500', '#AF52DE', '#FFCC00', '#5AC8FA'];

export function IncomeForm({ onAdd }: IncomeFormProps) {
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<TransactionType>('income');
  const [amount, setAmount] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  
  const [categories, setCategories] = React.useState<CategoryDefinition[]>(DEFAULT_CATEGORIES);
  const [showNewCategory, setShowNewCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [newCategoryColor, setNewCategoryColor] = React.useState(COLORS[0]);
  const [newCategoryBudget, setNewCategoryBudget] = React.useState('');

  React.useEffect(() => {
    const user = auth.currentUser;
    if (user && open) {
      const unsubscribe = subscribeToCategories(user.uid, (cats) => {
        setCategories(cats);
      });
      return () => unsubscribe();
    }
  }, [open]);

  // Handle category selection when type or categories change
  React.useEffect(() => {
    if (!open) return;

    const filtered = categories.filter(c => c.type === type);
    const currentCat = categories.find(c => c.id === categoryId);

    // If no category selected, or selected category is wrong type, or doesn't exist
    if (!categoryId || !currentCat || currentCat.type !== type) {
      if (filtered.length > 0) {
        setCategoryId(filtered[0].id);
      }
    }
  }, [type, categories, open, categoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || !categoryId) return;

    const newEntry: Transaction = {
      id: crypto.randomUUID(),
      amount: Number(amount),
      categoryId,
      description,
      date,
      type,
    };

    onAdd(newEntry);
    setAmount('');
    setDescription('');
    setOpen(false);
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newCat: CategoryDefinition = {
      id: crypto.randomUUID(),
      name: newCategoryName.trim(),
      color: newCategoryColor,
      type,
    };

    if (newCategoryBudget) {
      newCat.budget = Number(newCategoryBudget);
    }
    
    saveCategory(newCat);
    setCategoryId(newCat.id);
    setNewCategoryName('');
    setNewCategoryBudget('');
    setShowNewCategory(false);
  };

  const handleDeleteCategory = async (id: string) => {
    // Custom inline confirmation to avoid iframe issues with window.confirm
    const confirmed = window.confirm('¿Eliminar categoría?');
    if (confirmed) {
      try {
        await deleteCategory(id);
        setCategories(prev => prev.filter(c => c.id !== id));
        if (categoryId === id) {
          const remaining = categories.filter(c => c.id !== id && c.type === type);
          if (remaining.length > 0) setCategoryId(remaining[0].id);
          else setCategoryId('');
        }
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="apple-button-primary h-14 w-14 rounded-full p-0 fixed bottom-8 right-8 shadow-2xl z-50 hover:scale-110 transition-transform" />
        }
      >
        <Plus className="h-7 w-7" />
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[425px] rounded-[32px] border-none shadow-2xl max-h-[90vh] overflow-y-auto p-0 overflow-x-hidden">
        <div className="p-5 sm:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-center tracking-tighter">Nueva Transacción</DialogTitle>
          </DialogHeader>
          
          {!showNewCategory ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Toggle */}
              <div className="flex p-1.5 bg-gray-100/80 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-black transition-all",
                    type === 'income' ? "bg-white text-[#007AFF] shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <ArrowUpCircle className="h-4 w-4" /> Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-black transition-all",
                    type === 'expense' ? "bg-white text-[#FF3B30] shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <ArrowDownCircle className="h-4 w-4" /> Gasto
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Cantidad</Label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300">€</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="apple-input text-3xl font-black h-20 pl-12"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="category" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Categoría</Label>
                  <button 
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="text-[10px] text-[#007AFF] font-black uppercase tracking-widest hover:opacity-70 transition-opacity"
                  >
                    + Nueva
                  </button>
                </div>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="apple-input h-16 font-bold w-full overflow-hidden">
                    <span className="flex items-center gap-3 truncate w-full">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: categories.find(c => c.id === categoryId)?.color || '#ccc' }} 
                      />
                      <span className="truncate">
                        {categories.find(c => c.id === categoryId)?.name || 'Selecciona categoría'}
                      </span>
                    </span>
                  </SelectTrigger>
                  <SelectContent className="rounded-[24px] border-none shadow-2xl p-2 max-h-[300px]">
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="rounded-xl py-3 px-4 focus:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="font-bold text-gray-700">{cat.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs font-bold text-gray-400 italic">
                        No hay categorías de {type === 'income' ? 'ingreso' : 'gasto'}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="apple-input h-14 font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Nota</Label>
                  <Input
                    id="description"
                    placeholder="Opcional"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="apple-input h-14 font-bold"
                  />
                </div>
              </div>

              <Button type="submit" className={cn(
                "w-full h-18 text-lg font-black rounded-2xl transition-all shadow-xl active:scale-[0.98]",
                type === 'income' ? "apple-button-primary shadow-blue-100" : "bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white shadow-red-100"
              )}>
                Registrar {type === 'income' ? 'Ingreso' : 'Gasto'}
              </Button>
            </form>
          ) : (
            <div className="space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Nombre de Categoría</Label>
                <Input
                  placeholder="Ej: Comida, Viajes..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="apple-input h-16 font-bold text-lg"
                  autoFocus
                />
              </div>
              
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Presupuesto Mensual (Opcional)</Label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-gray-300">€</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newCategoryBudget}
                    onChange={(e) => setNewCategoryBudget(e.target.value)}
                    className="apple-input h-16 pl-12 font-bold text-lg"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Color de Identificación</Label>
                <div className="grid grid-cols-4 gap-4 p-1">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategoryColor(color)}
                      className={cn(
                        "h-12 rounded-2xl transition-all relative",
                        newCategoryColor === color ? "ring-4 ring-offset-4 ring-black scale-110 z-10" : "opacity-40 hover:opacity-100"
                      )}
                      style={{ backgroundColor: color }}
                    >
                      {newCategoryColor === color && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  variant="ghost" 
                  className="flex-1 rounded-2xl h-16 font-black text-gray-400 hover:bg-gray-100"
                  onClick={() => setShowNewCategory(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 apple-button-primary h-16 font-black text-lg shadow-blue-100"
                  onClick={handleCreateCategory}
                >
                  Crear Categoría
                </Button>
              </div>

              {/* Category Management List */}
              {filteredCategories.length > 0 && (
                <div className="pt-8 border-t border-gray-100">
                  <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-4 block">Gestionar Existentes</Label>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredCategories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl group">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-sm font-bold text-gray-700">{cat.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
