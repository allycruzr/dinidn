import { createContext, useContext, useState, useMemo, type ReactNode } from "react";
import type { Account, Transaction, Category, Invoice, Goal, PatrimonySnapshot, MonthlyData, CategorySpending } from "@/types";
import {
  mockAccounts,
  mockTransactions,
  mockCategories,
  mockGoals,
  mockPatrimony,
  mockInvoices,
} from "@/lib/mock-data";

type OpenFinanceConnectionType = "OPEN_BANKING" | "CREDIT_CARD";
type OpenFinanceConnectionStatus = "CONNECTED" | "DISCONNECTED";

export interface OpenFinanceConnection {
  id: string;
  institution: string;
  accountName: string;
  type: "CHECKING" | "CREDIT";
  connectionType: OpenFinanceConnectionType;
  status: OpenFinanceConnectionStatus;
  accountId: string;
  lastSyncedAt?: string;
}

export interface DataContextValue {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  invoices: Invoice[];
  goals: Goal[];
  patrimony: PatrimonySnapshot[];
  monthlyData: MonthlyData[];
  categorySpending: CategorySpending[];
  openFinanceConnections: OpenFinanceConnection[];
  connectInstitution: (connectionId: string) => Promise<void>;
  syncTransactions: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

const initialConnections: OpenFinanceConnection[] = [
  {
    id: "conn-nubank-checking",
    institution: "Nubank",
    accountName: "Conta Corrente",
    type: "CHECKING",
    connectionType: "OPEN_BANKING",
    status: "DISCONNECTED",
    accountId: "a1",
  },
  {
    id: "conn-nubank-credit",
    institution: "Nubank",
    accountName: "Cartão de Crédito",
    type: "CREDIT",
    connectionType: "CREDIT_CARD",
    status: "DISCONNECTED",
    accountId: "a4",
  },
  {
    id: "conn-btg-checking",
    institution: "BTG Pactual",
    accountName: "Conta Digital",
    type: "CHECKING",
    connectionType: "OPEN_BANKING",
    status: "DISCONNECTED",
    accountId: "a2",
  },
  {
    id: "conn-btg-credit",
    institution: "BTG Pactual",
    accountName: "Cartão Black",
    type: "CREDIT",
    connectionType: "CREDIT_CARD",
    status: "DISCONNECTED",
    accountId: "a5",
  },
  {
    id: "conn-bb-checking",
    institution: "Banco do Brasil",
    accountName: "Conta Corrente",
    type: "CHECKING",
    connectionType: "OPEN_BANKING",
    status: "DISCONNECTED",
    accountId: "a3",
  },
  {
    id: "conn-bb-credit",
    institution: "Banco do Brasil",
    accountName: "Cartão Platinum",
    type: "CREDIT",
    connectionType: "CREDIT_CARD",
    status: "DISCONNECTED",
    accountId: "a6",
  },
];

const createTransactionId = (connectionId: string, index: number) => `sync-${connectionId}-${index}`;

const sampleDescriptions = {
  CHECKING: [
    "Pix recebido",
    "Compra no supermercado",
    "Pagamento boleto",
    "TED recebida",
    "Depósito salário",
  ],
  CREDIT: [
    "Compra cartão",
    "Assinatura streaming",
    "Posto de gasolina",
    "Restaurante",
    "Viagem aérea",
  ],
};

const sampleCategoryIds = {
  CHECKING: [0, 1, 2, 3, 4, 12],
  CREDIT: [0, 1, 2, 5, 6, 14],
};

function formatSyncTime(date: Date) {
  return date.toISOString();
}

function buildTransaction(account: Account, categories: Category[], index: number, connectionId: string): Transaction {
  const isCredit = account.type === "CREDIT";
  const descriptionList = isCredit ? sampleDescriptions.CREDIT : sampleDescriptions.CHECKING;
  const description = `${descriptionList[index % descriptionList.length]} - ${account.institution}`;
  const amountBase = Math.round((150 + index * 47) * 100) / 100;
  const amount = isCredit ? -amountBase : index % 2 === 0 ? amountBase : -amountBase;
  const category = categories[sampleCategoryIds[account.type][index % sampleCategoryIds[account.type].length]];

  return {
    id: createTransactionId(connectionId, index),
    accountId: account.id,
    description,
    amount,
    type: amount >= 0 ? "CREDIT" : "DEBIT",
    category,
    date: new Date(Date.now() - index * 86400000).toISOString().split("T")[0],
    status: "CONFIRMED",
    isRecurring: !isCredit && index % 3 === 0,
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(() => mockAccounts.map((account) => ({ ...account })));
  const [transactions, setTransactions] = useState<Transaction[]>(() => mockTransactions.map((transaction) => ({ ...transaction, category: transaction.category ? { ...transaction.category } : undefined })));
  const [categories] = useState<Category[]>(() => mockCategories.map((category) => ({ ...category })));
  const [invoices] = useState<Invoice[]>(() => mockInvoices.map((invoice) => ({ ...invoice })));
  const [goals] = useState<Goal[]>(() => mockGoals.map((goal) => ({ ...goal })));
  const [patrimony, setPatrimony] = useState<PatrimonySnapshot[]>(() => mockPatrimony.map((entry) => ({ ...entry })));

  const monthlyData = useMemo<MonthlyData[]>(() => {
    const byMonth = new Map<string, { income: number; expenses: number }>();
    for (const t of transactions) {
      const monthKey = t.date.slice(0, 7);
      const entry = byMonth.get(monthKey) ?? { income: 0, expenses: 0 };
      if (t.amount >= 0) {
        entry.income += t.amount;
      } else {
        entry.expenses += Math.abs(t.amount);
      }
      byMonth.set(monthKey, entry);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short" })
          .replace(".", "")
          .replace(/^\w/, (c) => c.toUpperCase()),
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
        balance: Math.round((data.income - data.expenses) * 100) / 100,
      }));
  }, [transactions]);

  const categorySpending = useMemo<CategorySpending[]>(() => {
    const expenseTransactions = transactions.filter((t) => t.amount < 0 && t.category);
    const totalExpenses = expenseTransactions.reduce((s, t) => s + Math.abs(t.amount), 0);
    if (totalExpenses === 0) return [];

    const byCategory = new Map<string, { name: string; icon: string; color: string; value: number }>();
    for (const t of expenseTransactions) {
      const cat = t.category!;
      const entry = byCategory.get(cat.name) ?? { name: cat.name, icon: cat.icon, color: cat.color, value: 0 };
      entry.value += Math.abs(t.amount);
      byCategory.set(cat.name, entry);
    }

    return Array.from(byCategory.values())
      .map((entry) => ({
        ...entry,
        percentage: Math.round((entry.value / totalExpenses) * 1000) / 10,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);
  const [openFinanceConnections, setOpenFinanceConnections] = useState<OpenFinanceConnection[]>(() => [...initialConnections]);

  const connectInstitution = async (connectionId: string) => {
    setOpenFinanceConnections((prev) =>
      prev.map((connection) =>
        connection.id === connectionId
          ? { ...connection, status: "CONNECTED", lastSyncedAt: formatSyncTime(new Date()) }
          : connection,
      ),
    );
  };

  const syncTransactions = async () => {
    setOpenFinanceConnections((prev) =>
      prev.map((c) =>
        c.status === "CONNECTED"
          ? { ...c, lastSyncedAt: formatSyncTime(new Date()) }
          : c,
      ),
    );

    const connectedConnections = openFinanceConnections.filter(
      (c) => c.status === "CONNECTED",
    );
    const additions: Transaction[] = [];
    connectedConnections.forEach((connection, index) => {
      const account = accounts.find((a) => a.id === connection.accountId);
      if (!account) return;
      additions.push(buildTransaction(account, categories, index, connection.id));
    });

    if (additions.length === 0) return;

    setTransactions((current) => {
      const missing = additions.filter(
        (newTx) => !current.some((tx) => tx.id === newTx.id),
      );
      if (missing.length === 0) return current;

      setAccounts((currentAccounts) =>
        currentAccounts.map((account) => {
          const delta = missing
            .filter((tx) => tx.accountId === account.id)
            .reduce((sum, tx) => sum + tx.amount, 0);
          return delta !== 0
            ? { ...account, balance: account.balance + delta }
            : account;
        }),
      );

      return [...current, ...missing];
    });

    setPatrimony((prev) => {
      const now = new Date();
      const refMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      if (prev.some((p) => p.referenceMonth === refMonth)) return prev;

      const totalAssets = accounts
        .filter((a) => a.type !== "CREDIT")
        .reduce((s, a) => s + a.balance, 0);
      const totalLiabilities = accounts
        .filter((a) => a.type === "CREDIT")
        .reduce((s, a) => s + Math.abs(a.balance), 0);

      return [
        ...prev,
        {
          id: `p-sync-${refMonth}`,
          referenceMonth: refMonth,
          totalAssets,
          totalLiabilities,
          netWorth: totalAssets - totalLiabilities,
        },
      ];
    });
  };

  return (
    <DataContext.Provider
      value={{
        accounts,
        transactions,
        categories,
        invoices,
        goals,
        patrimony,
        monthlyData,
        categorySpending,
        openFinanceConnections,
        connectInstitution,
        syncTransactions,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
}
