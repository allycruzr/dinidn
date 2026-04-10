export interface Account {
  id: string;
  institution: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT';
  balance: number;
  creditLimit?: number;
  currency: string;
  lastSyncedAt: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  isSystem: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  category?: Category;
  date: string;
  status: 'PENDING' | 'CONFIRMED';
  isRecurring: boolean;
}

export interface Invoice {
  id: string;
  accountId: string;
  referenceMonth: string;
  dueDate: string;
  closingDate: string;
  totalAmount: number;
  status: 'OPEN' | 'CLOSED' | 'PAID';
}

export interface Goal {
  id: string;
  name: string;
  description?: string;
  type: 'SAVINGS' | 'DEBT_PAYMENT' | 'INVESTMENT' | 'EXPENSE_LIMIT';
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category?: Category;
  color: string;
  icon: string;
  isActive: boolean;
}

export interface PatrimonySnapshot {
  id: string;
  referenceMonth: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface DailyBalance {
  date: string;
  balance: number;
}

export interface CategorySpending {
  name: string;
  icon: string;
  color: string;
  value: number;
  percentage: number;
}
