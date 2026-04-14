export type TransactionType = 'income' | 'expense';

export interface CategoryDefinition {
  id: string;
  name: string;
  color: string;
  type: TransactionType;
  userId?: string;
  budget?: number;
}

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  date: string;
  description: string;
  type: TransactionType;
  userId?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  byCategory: Record<string, number>;
  monthlyTrend: { month: string; income: number; expense: number }[];
}
