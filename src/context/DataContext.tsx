import { createContext, useContext, useState, type ReactNode } from "react";
import type { Account, Transaction, Category, Invoice, Goal, PatrimonySnapshot, MonthlyData, CategorySpending } from "@/types";
import {
  mockAccounts,
  mockTransactions,
  mockCategories,
  mockGoals,
  mockPatrimony,
  mockMonthlyData,
  mockCategorySpending,
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

const createTransactionId = (accountId: string) => `${accountId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

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

function buildTransaction(account: Account, categories: Category[], index: number): Transaction {
  const isCredit = account.type === "CREDIT";
  const descriptionList = isCredit ? sampleDescriptions.CREDIT : sampleDescriptions.CHECKING;
  const description = `${descriptionList[index % descriptionList.length]} - ${account.institution}`;
  const amountBase = Math.round((Math.random() * 350 + 40) * 100) / 100;
  const amount = isCredit ? -amountBase : Math.random() > 0.5 ? amountBase : -amountBase;
  const category = categories[sampleCategoryIds[account.type][index % sampleCategoryIds[account.type].length]];

  return {
    id: createTransactionId(account.id),
    accountId: account.id,
    description,
    amount,
    type: amount >= 0 ? "CREDIT" : "DEBIT",
    category,
    date: new Date(Date.now() - index * 86400000).toISOString().split("T")[0],
    status: "CONFIRMED",
    isRecurring: !isCredit && Math.random() > 0.6,
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(() => mockAccounts.map((account) => ({ ...account })));
  const [transactions, setTransactions] = useState<Transaction[]>(() => mockTransactions.map((transaction) => ({ ...transaction, category: transaction.category ? { ...transaction.category } : undefined })));
  const [categories] = useState<Category[]>(() => mockCategories.map((category) => ({ ...category })));
  const [invoices] = useState<Invoice[]>(() => mockInvoices.map((invoice) => ({ ...invoice })));
  const [goals] = useState<Goal[]>(() => mockGoals.map((goal) => ({ ...goal })));
  const [patrimony] = useState<PatrimonySnapshot[]>(() => mockPatrimony.map((entry) => ({ ...entry })));
  const [monthlyData] = useState<MonthlyData[]>(() => mockMonthlyData.map((entry) => ({ ...entry })));
  const [categorySpending] = useState<CategorySpending[]>(() => mockCategorySpending.map((entry) => ({ ...entry })));
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
    setOpenFinanceConnections((prevConnections) => {
      const updatedConnections = prevConnections.map((connection) =>
        connection.status === "CONNECTED"
          ? { ...connection, lastSyncedAt: formatSyncTime(new Date()) }
          : connection,
      );

      const additions: Transaction[] = [];
      updatedConnections
        .filter((connection) => connection.status === "CONNECTED")
        .forEach((connection, index) => {
          const account = accounts.find((a) => a.id === connection.accountId);
          if (!account) return;

          const newTransaction = buildTransaction(account, categories, index);
          additions.push(newTransaction);
        });

      if (additions.length > 0) {
        setTransactions((current) => {
          const missing = additions.filter((newTx) => !current.some((tx) => tx.id === newTx.id));
          return [...current, ...missing];
        });

        setAccounts((current) =>
          current.map((account) => {
            const delta = additions
              .filter((tx) => tx.accountId === account.id)
              .reduce((sum, tx) => sum + tx.amount, 0);
            return delta !== 0 ? { ...account, balance: account.balance + delta } : account;
          }),
        );
      }

      return updatedConnections;
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
