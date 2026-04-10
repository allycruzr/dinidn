import type {
  Account, Category, Transaction, Goal,
  PatrimonySnapshot, MonthlyData, DailyBalance, CategorySpending, Invoice
} from '@/types';

export const mockCategories: Category[] = [
  { id: '1', name: 'Alimentação', icon: '🍔', color: '#F59E0B', type: 'EXPENSE', isSystem: true },
  { id: '2', name: 'Transporte', icon: '🚗', color: '#3B82F6', type: 'EXPENSE', isSystem: true },
  { id: '3', name: 'Moradia', icon: '🏠', color: '#8B5CF6', type: 'EXPENSE', isSystem: true },
  { id: '4', name: 'Saúde', icon: '❤️', color: '#EF4444', type: 'EXPENSE', isSystem: true },
  { id: '5', name: 'Educação', icon: '📚', color: '#06B6D4', type: 'EXPENSE', isSystem: true },
  { id: '6', name: 'Lazer', icon: '🎮', color: '#EC4899', type: 'EXPENSE', isSystem: true },
  { id: '7', name: 'Assinaturas', icon: '📱', color: '#6366F1', type: 'EXPENSE', isSystem: true },
  { id: '8', name: 'Investimentos', icon: '📈', color: '#10B981', type: 'EXPENSE', isSystem: true },
  { id: '9', name: 'Salário', icon: '💰', color: '#10B981', type: 'INCOME', isSystem: true },
  { id: '10', name: 'Freelance', icon: '💻', color: '#06B6D4', type: 'INCOME', isSystem: true },
  { id: '11', name: 'Rendimentos', icon: '📊', color: '#8B5CF6', type: 'INCOME', isSystem: true },
  { id: '12', name: 'Transferências', icon: '↔️', color: '#6B7280', type: 'TRANSFER', isSystem: true },
  { id: '13', name: 'Vestuário', icon: '👕', color: '#F97316', type: 'EXPENSE', isSystem: true },
  { id: '14', name: 'Outros', icon: '📦', color: '#9CA3AF', type: 'EXPENSE', isSystem: true },
];

export const mockAccounts: Account[] = [
  { id: 'a1', institution: 'Nubank', name: 'Conta Corrente', type: 'CHECKING', balance: 8432.50, currency: 'BRL', lastSyncedAt: '2025-03-29T10:00:00Z', isActive: true },
  { id: 'a2', institution: 'BTG Pactual', name: 'Conta Digital', type: 'CHECKING', balance: 24850.00, currency: 'BRL', lastSyncedAt: '2025-03-29T10:00:00Z', isActive: true },
  { id: 'a3', institution: 'Banco do Brasil', name: 'Conta Corrente', type: 'CHECKING', balance: 3210.75, currency: 'BRL', lastSyncedAt: '2025-03-29T10:00:00Z', isActive: true },
  { id: 'a4', institution: 'Nubank', name: 'Cartão de Crédito', type: 'CREDIT', balance: -2340.00, creditLimit: 12000, currency: 'BRL', lastSyncedAt: '2025-03-29T10:00:00Z', isActive: true },
  { id: 'a5', institution: 'BTG Pactual', name: 'Cartão Black', type: 'CREDIT', balance: -5680.00, creditLimit: 30000, currency: 'BRL', lastSyncedAt: '2025-03-29T10:00:00Z', isActive: true },
  { id: 'a6', institution: 'Banco do Brasil', name: 'Cartão Platinum', type: 'CREDIT', balance: -4120.00, creditLimit: 25000, currency: 'BRL', lastSyncedAt: '2025-03-29T10:00:00Z', isActive: true },
];

export const mockTransactions: Transaction[] = [
  { id: 't1', accountId: 'a1', description: 'PAGTO PIX - iFood', amount: -89.90, type: 'DEBIT', category: mockCategories[0], date: '2025-03-28', status: 'CONFIRMED', isRecurring: false },
  { id: 't2', accountId: 'a2', description: 'TED RECEBIDA - Empresa XYZ LTDA', amount: 12500.00, type: 'CREDIT', category: mockCategories[8], date: '2025-03-28', status: 'CONFIRMED', isRecurring: true },
  { id: 't3', accountId: 'a1', description: 'UBER *TRIP', amount: -32.50, type: 'DEBIT', category: mockCategories[1], date: '2025-03-27', status: 'CONFIRMED', isRecurring: false },
  { id: 't4', accountId: 'a4', description: 'NETFLIX.COM', amount: -55.90, type: 'DEBIT', category: mockCategories[6], date: '2025-03-27', status: 'CONFIRMED', isRecurring: true },
  { id: 't5', accountId: 'a3', description: 'BOLETO ALUGUEL', amount: -2800.00, type: 'DEBIT', category: mockCategories[2], date: '2025-03-25', status: 'CONFIRMED', isRecurring: true },
  { id: 't6', accountId: 'a1', description: 'PIX - Farmácia Drogasil', amount: -67.40, type: 'DEBIT', category: mockCategories[3], date: '2025-03-25', status: 'CONFIRMED', isRecurring: false },
  { id: 't7', accountId: 'a5', description: 'AMAZON.COM.BR', amount: -349.90, type: 'DEBIT', category: mockCategories[5], date: '2025-03-24', status: 'CONFIRMED', isRecurring: false },
  { id: 't8', accountId: 'a2', description: 'RENDIMENTO CDB', amount: 185.32, type: 'CREDIT', category: mockCategories[10], date: '2025-03-24', status: 'CONFIRMED', isRecurring: false },
  { id: 't9', accountId: 'a1', description: 'PAGTO PIX - Mercado Livre', amount: -156.00, type: 'DEBIT', category: mockCategories[12], date: '2025-03-23', status: 'CONFIRMED', isRecurring: false },
  { id: 't10', accountId: 'a4', description: 'SPOTIFY', amount: -34.90, type: 'DEBIT', category: mockCategories[6], date: '2025-03-23', status: 'CONFIRMED', isRecurring: true },
  { id: 't11', accountId: 'a2', description: 'PIX RECEBIDO - Cliente Freelance', amount: 3200.00, type: 'CREDIT', category: mockCategories[9], date: '2025-03-22', status: 'CONFIRMED', isRecurring: false },
  { id: 't12', accountId: 'a1', description: 'SUPERMERCADO EXTRA', amount: -432.15, type: 'DEBIT', category: mockCategories[0], date: '2025-03-21', status: 'CONFIRMED', isRecurring: false },
  { id: 't13', accountId: 'a3', description: 'ENERGIA - ENEL SP', amount: -287.50, type: 'DEBIT', category: mockCategories[2], date: '2025-03-20', status: 'CONFIRMED', isRecurring: true },
  { id: 't14', accountId: 'a5', description: 'RESTAURANTE OUTBACK', amount: -215.00, type: 'DEBIT', category: mockCategories[0], date: '2025-03-19', status: 'CONFIRMED', isRecurring: false },
  { id: 't15', accountId: 'a1', description: 'ACADEMIA SMARTFIT', amount: -119.90, type: 'DEBIT', category: mockCategories[3], date: '2025-03-18', status: 'CONFIRMED', isRecurring: true },
];

export const mockMonthlyData: MonthlyData[] = [
  { month: 'Out', income: 15200, expenses: 11800, balance: 3400 },
  { month: 'Nov', income: 16500, expenses: 13200, balance: 3300 },
  { month: 'Dez', income: 18900, expenses: 16500, balance: 2400 },
  { month: 'Jan', income: 15800, expenses: 12100, balance: 3700 },
  { month: 'Fev', income: 16200, expenses: 11900, balance: 4300 },
  { month: 'Mar', income: 15885, expenses: 10690, balance: 5195 },
];

export const mockDailyBalance: DailyBalance[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2025, 2, i + 1);
  return {
    date: date.toISOString().split('T')[0],
    balance: 32000 + Math.sin(i / 3) * 4000 + i * 100,
  };
});

export const mockCategorySpending: CategorySpending[] = [
  { name: 'Moradia', icon: '🏠', color: '#8B5CF6', value: 3087.50, percentage: 28.9 },
  { name: 'Alimentação', icon: '🍔', color: '#F59E0B', value: 2180.55, percentage: 20.4 },
  { name: 'Assinaturas', icon: '📱', color: '#6366F1', value: 890.70, percentage: 8.3 },
  { name: 'Transporte', icon: '🚗', color: '#3B82F6', value: 780.00, percentage: 7.3 },
  { name: 'Lazer', icon: '🎮', color: '#EC4899', value: 564.90, percentage: 5.3 },
  { name: 'Saúde', icon: '❤️', color: '#EF4444', value: 487.30, percentage: 4.6 },
  { name: 'Vestuário', icon: '👕', color: '#F97316', value: 356.00, percentage: 3.3 },
  { name: 'Outros', icon: '📦', color: '#9CA3AF', value: 2343.05, percentage: 21.9 },
];

export const mockGoals: Goal[] = [
  { id: 'g1', name: 'Reserva de Emergência', type: 'SAVINGS', targetAmount: 50000, currentAmount: 32500, targetDate: '2025-12-31', color: '#10B981', icon: '🛡️', isActive: true },
  { id: 'g2', name: 'Viagem Europa', type: 'SAVINGS', targetAmount: 25000, currentAmount: 8900, targetDate: '2026-06-30', color: '#3B82F6', icon: '✈️', isActive: true },
  { id: 'g3', name: 'Limite Alimentação', description: 'Gastar no máximo R$2.000/mês', type: 'EXPENSE_LIMIT', targetAmount: 2000, currentAmount: 1580, category: mockCategories[0], color: '#F59E0B', icon: '🍔', isActive: true },
  { id: 'g4', name: 'Entrada Apartamento', type: 'SAVINGS', targetAmount: 120000, currentAmount: 45000, targetDate: '2027-06-30', color: '#8B5CF6', icon: '🏠', isActive: true },
];

export const mockPatrimony: PatrimonySnapshot[] = [
  { id: 'p1', referenceMonth: '2024-04', totalAssets: 28000, totalLiabilities: 5200, netWorth: 22800 },
  { id: 'p2', referenceMonth: '2024-05', totalAssets: 29500, totalLiabilities: 4800, netWorth: 24700 },
  { id: 'p3', referenceMonth: '2024-06', totalAssets: 30200, totalLiabilities: 6100, netWorth: 24100 },
  { id: 'p4', referenceMonth: '2024-07', totalAssets: 31800, totalLiabilities: 5500, netWorth: 26300 },
  { id: 'p5', referenceMonth: '2024-08', totalAssets: 32500, totalLiabilities: 4900, netWorth: 27600 },
  { id: 'p6', referenceMonth: '2024-09', totalAssets: 33100, totalLiabilities: 5300, netWorth: 27800 },
  { id: 'p7', referenceMonth: '2024-10', totalAssets: 34200, totalLiabilities: 5800, netWorth: 28400 },
  { id: 'p8', referenceMonth: '2024-11', totalAssets: 35100, totalLiabilities: 6200, netWorth: 28900 },
  { id: 'p9', referenceMonth: '2024-12', totalAssets: 37500, totalLiabilities: 7100, netWorth: 30400 },
  { id: 'p10', referenceMonth: '2025-01', totalAssets: 35800, totalLiabilities: 5800, netWorth: 30000 },
  { id: 'p11', referenceMonth: '2025-02', totalAssets: 36200, totalLiabilities: 6400, netWorth: 29800 },
  { id: 'p12', referenceMonth: '2025-03', totalAssets: 36493, totalLiabilities: 8020, netWorth: 28473 },
];

export const mockInvoices: Invoice[] = [
  { id: 'i1', accountId: 'a4', referenceMonth: '2025-03', dueDate: '2025-04-10', closingDate: '2025-03-25', totalAmount: 2340, status: 'OPEN' },
  { id: 'i2', accountId: 'a5', referenceMonth: '2025-03', dueDate: '2025-04-15', closingDate: '2025-03-28', totalAmount: 5680, status: 'OPEN' },
  { id: 'i5', accountId: 'a6', referenceMonth: '2025-03', dueDate: '2025-04-18', closingDate: '2025-03-30', totalAmount: 4120, status: 'OPEN' },
  { id: 'i3', accountId: 'a4', referenceMonth: '2025-02', dueDate: '2025-03-10', closingDate: '2025-02-25', totalAmount: 1890, status: 'PAID' },
  { id: 'i4', accountId: 'a5', referenceMonth: '2025-02', dueDate: '2025-03-15', closingDate: '2025-02-28', totalAmount: 4320, status: 'PAID' },
];
