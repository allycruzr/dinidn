import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Account,
  Transaction,
  Category,
  Invoice,
  Goal,
  PatrimonySnapshot,
  MonthlyData,
  CategorySpending,
} from "@/types";
import { supabase } from "@/lib/supabase";

export interface BelvoLink {
  id: string;
  belvoLinkId: string;
  institution: string;
  status: string;
  createdAt: string;
  lastSyncedAt: string | null;
}

export interface DataContextValue {
  loading: boolean;
  error: string | null;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  invoices: Invoice[];
  goals: Goal[];
  patrimony: PatrimonySnapshot[];
  monthlyData: MonthlyData[];
  categorySpending: CategorySpending[];
  belvoLinks: BelvoLink[];
  refresh: () => Promise<void>;
  registerBelvoLink: (belvoLinkId: string, institution: string) => Promise<void>;
  syncLink: (belvoLinkId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

// ---------- Row mappers: snake_case DB -> camelCase TS ----------
/* eslint-disable @typescript-eslint/no-explicit-any */

function mapAccount(row: any): Account {
  return {
    id: row.id,
    institution: row.institution,
    name: row.name,
    type: row.type,
    balance: Number(row.balance),
    creditLimit: row.credit_limit != null ? Number(row.credit_limit) : undefined,
    currency: row.currency,
    lastSyncedAt: row.last_synced_at ?? "",
    isActive: row.is_active,
  };
}

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    type: row.type,
    isSystem: row.is_system,
  };
}

function mapTransaction(row: any, categoriesById: Map<string, Category>): Transaction {
  let category: Category | undefined;
  if (row.category_id) {
    category = categoriesById.get(row.category_id);
  } else if (row.category_name) {
    category = {
      id: "",
      name: row.category_name,
      icon: "",
      color: "#9CA3AF",
      type: "EXPENSE",
      isSystem: false,
    };
  }
  return {
    id: row.id,
    accountId: row.account_id,
    description: row.description,
    amount: Number(row.amount),
    type: row.type,
    category,
    date: row.date,
    status: row.status,
    isRecurring: row.is_recurring,
  };
}

function mapInvoice(row: any): Invoice {
  return {
    id: row.id,
    accountId: row.account_id,
    referenceMonth: row.reference_month,
    dueDate: row.due_date,
    closingDate: row.closing_date,
    totalAmount: Number(row.total_amount),
    status: row.status,
  };
}

function mapGoal(row: any, categoriesById: Map<string, Category>): Goal {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    type: row.type,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    targetDate: row.target_date ?? undefined,
    category: row.category_id ? categoriesById.get(row.category_id) : undefined,
    color: row.color,
    icon: row.icon,
    isActive: row.is_active,
  };
}

function mapPatrimony(row: any): PatrimonySnapshot {
  return {
    id: row.id,
    referenceMonth: row.reference_month,
    totalAssets: Number(row.total_assets),
    totalLiabilities: Number(row.total_liabilities),
    netWorth: Number(row.net_worth),
  };
}

function mapBelvoLink(row: any): BelvoLink {
  return {
    id: row.id,
    belvoLinkId: row.belvo_link_id,
    institution: row.institution,
    status: row.status,
    createdAt: row.created_at,
    lastSyncedAt: row.last_synced_at,
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------- Provider ----------

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [patrimony, setPatrimony] = useState<PatrimonySnapshot[]>([]);
  const [belvoLinks, setBelvoLinks] = useState<BelvoLink[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, accRes, invRes, goalRes, patRes, linkRes, txRes] =
        await Promise.all([
          supabase.from("categories").select("*"),
          supabase
            .from("accounts")
            .select("*")
            .order("created_at", { ascending: true }),
          supabase
            .from("invoices")
            .select("*")
            .order("due_date", { ascending: false }),
          supabase
            .from("goals")
            .select("*")
            .order("created_at", { ascending: true }),
          supabase
            .from("patrimony_snapshots")
            .select("*")
            .order("reference_month", { ascending: true }),
          supabase
            .from("belvo_links")
            .select("*")
            .order("created_at", { ascending: true }),
          supabase
            .from("transactions")
            .select("*")
            .order("date", { ascending: false }),
        ]);

      if (catRes.error) throw catRes.error;
      if (accRes.error) throw accRes.error;
      if (invRes.error) throw invRes.error;
      if (goalRes.error) throw goalRes.error;
      if (patRes.error) throw patRes.error;
      if (linkRes.error) throw linkRes.error;
      if (txRes.error) throw txRes.error;

      const mappedCategories = (catRes.data ?? []).map(mapCategory);
      const categoriesById = new Map(mappedCategories.map((c) => [c.id, c]));

      setCategories(mappedCategories);
      setAccounts((accRes.data ?? []).map(mapAccount));
      setInvoices((invRes.data ?? []).map(mapInvoice));
      setGoals((goalRes.data ?? []).map((r) => mapGoal(r, categoriesById)));
      setPatrimony((patRes.data ?? []).map(mapPatrimony));
      setBelvoLinks((linkRes.data ?? []).map(mapBelvoLink));
      setTransactions(
        (txRes.data ?? []).map((r) => mapTransaction(r, categoriesById)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const registerBelvoLink = useCallback(
    async (belvoLinkId: string, institution: string) => {
      const { error: regError } = await supabase.functions.invoke(
        "belvo-register-link",
        { body: { link_id: belvoLinkId, institution } },
      );
      if (regError) throw regError;
      // Kick off initial sync (fire-and-refresh)
      await supabase.functions.invoke("belvo-sync", {
        body: { belvo_link_id: belvoLinkId },
      });
      await refresh();
    },
    [refresh],
  );

  const syncLink = useCallback(
    async (belvoLinkId: string) => {
      const { error: syncError } = await supabase.functions.invoke(
        "belvo-sync",
        { body: { belvo_link_id: belvoLinkId } },
      );
      if (syncError) throw syncError;
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

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
        month: new Date(month + "-01")
          .toLocaleDateString("pt-BR", { month: "short" })
          .replace(".", "")
          .replace(/^\w/, (c) => c.toUpperCase()),
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
        balance: Math.round((data.income - data.expenses) * 100) / 100,
      }));
  }, [transactions]);

  const categorySpending = useMemo<CategorySpending[]>(() => {
    const expenseTransactions = transactions.filter(
      (t) => t.amount < 0 && t.category,
    );
    const totalExpenses = expenseTransactions.reduce(
      (s, t) => s + Math.abs(t.amount),
      0,
    );
    if (totalExpenses === 0) return [];

    const byCategory = new Map<
      string,
      { name: string; icon: string; color: string; value: number }
    >();
    for (const t of expenseTransactions) {
      const cat = t.category!;
      const entry = byCategory.get(cat.name) ?? {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        value: 0,
      };
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

  return (
    <DataContext.Provider
      value={{
        loading,
        error,
        accounts,
        transactions,
        categories,
        invoices,
        goals,
        patrimony,
        monthlyData,
        categorySpending,
        belvoLinks,
        refresh,
        registerBelvoLink,
        syncLink,
        signOut,
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
