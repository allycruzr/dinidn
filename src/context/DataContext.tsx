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
import { parseOfx } from "@/lib/ofxParser";
import { parseXlsx } from "@/lib/xlsxParser";

export interface ImportOfxResult {
  accountsImported: number;
  transactionsImported: number;
}

export interface ImportXlsxOptions {
  institution: string;
  accountName: string;
  accountType: "CHECKING" | "SAVINGS" | "CREDIT";
  accountIdentifier: string; // stable user-provided id (e.g. "BTG-corrente" or "BTG-cartao-black")
}

export interface ImportXlsxResult {
  transactionsImported: number;
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
  refresh: () => Promise<void>;
  importOfx: (file: File) => Promise<ImportOfxResult>;
  importXlsx: (file: File, options: ImportXlsxOptions) => Promise<ImportXlsxResult>;
  deleteAccount: (accountId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const BR_BANK_NAMES: Record<string, string> = {
  "001": "Banco do Brasil",
  "033": "Santander",
  "077": "Inter",
  "104": "Caixa",
  "208": "BTG Pactual",
  "212": "Banco Original",
  "218": "BS2",
  "237": "Bradesco",
  "260": "Nubank",
  "336": "C6 Bank",
  "341": "Itau",
  "380": "PicPay",
  "422": "Safra",
  "655": "Votorantim",
  "745": "Citibank",
};

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

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, accRes, invRes, goalRes, patRes, txRes] = await Promise.all([
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
          .from("transactions")
          .select("*")
          .order("date", { ascending: false }),
      ]);

      if (catRes.error) throw catRes.error;
      if (accRes.error) throw accRes.error;
      if (invRes.error) throw invRes.error;
      if (goalRes.error) throw goalRes.error;
      if (patRes.error) throw patRes.error;
      if (txRes.error) throw txRes.error;

      const mappedCategories = (catRes.data ?? []).map(mapCategory);
      const categoriesById = new Map(mappedCategories.map((c) => [c.id, c]));

      setCategories(mappedCategories);
      setAccounts((accRes.data ?? []).map(mapAccount));
      setInvoices((invRes.data ?? []).map(mapInvoice));
      setGoals((goalRes.data ?? []).map((r) => mapGoal(r, categoriesById)));
      setPatrimony((patRes.data ?? []).map(mapPatrimony));
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

  const importOfx = useCallback(
    async (file: File): Promise<ImportOfxResult> => {
      const content = await file.text();
      const parsed = parseOfx(content);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error("Sessao nao encontrada. Faca login novamente.");
      }
      const userId = userData.user.id;
      const now = new Date().toISOString();

      let accountsImported = 0;
      let transactionsImported = 0;

      for (const stmt of parsed.statements) {
        const ofxAcc = stmt.account;
        if (!ofxAcc.accountId) continue;

        const externalAccountId = `ofx:${ofxAcc.bankId || "unknown"}:${ofxAcc.accountId}`;
        const institutionName =
          BR_BANK_NAMES[ofxAcc.bankId] ??
          (ofxAcc.type === "CREDIT"
            ? "Cartao de credito"
            : `Banco ${ofxAcc.bankId || "desconhecido"}`);

        const balance = ofxAcc.balance != null
          ? (ofxAcc.type === "CREDIT"
              ? -Math.abs(ofxAcc.balance)
              : ofxAcc.balance)
          : 0;

        const accountRow = {
          user_id: userId,
          external_id: externalAccountId,
          institution: institutionName,
          name: ofxAcc.type === "CREDIT"
            ? `Cartao ${ofxAcc.accountId.slice(-4)}`
            : `Conta ${ofxAcc.accountId}`,
          type: ofxAcc.type,
          balance,
          currency: ofxAcc.currency || "BRL",
          is_active: true,
          last_synced_at: now,
        };

        const { data: upsertedAccount, error: accError } = await supabase
          .from("accounts")
          .upsert(accountRow, { onConflict: "external_id" })
          .select("id")
          .single();

        if (accError) {
          throw new Error(
            `Erro ao salvar conta ${externalAccountId}: ${accError.message}`,
          );
        }
        accountsImported++;

        const txRows = stmt.transactions
          .filter((tx) => !!tx.date && !!tx.fitId)
          .map((tx) => ({
            user_id: userId,
            account_id: upsertedAccount.id,
            external_id: `ofx:${ofxAcc.bankId || "unknown"}:${ofxAcc.accountId}:${tx.fitId}`,
            description: tx.description || "(sem descricao)",
            amount: tx.amount,
            type: tx.type,
            date: tx.date,
            status: "CONFIRMED",
            is_recurring: false,
          }));

        if (txRows.length > 0) {
          const { error: txError } = await supabase
            .from("transactions")
            .upsert(txRows, { onConflict: "external_id" });
          if (txError) {
            throw new Error(`Erro ao salvar transacoes: ${txError.message}`);
          }
          transactionsImported += txRows.length;
        }
      }

      await refresh();
      return { accountsImported, transactionsImported };
    },
    [refresh],
  );

  const importXlsx = useCallback(
    async (file: File, options: ImportXlsxOptions): Promise<ImportXlsxResult> => {
      const parsed = await parseXlsx(file);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error("Sessao nao encontrada. Faca login novamente.");
      }
      const userId = userData.user.id;
      const now = new Date().toISOString();

      const externalAccountId = `xlsx:${options.accountIdentifier}`;

      // Use the balance parsed from XLSX metadata ("Saldo atual") if present.
      // Fall back to 0 — transaction sum is NOT the current balance, it's the
      // period movement.
      const rawBalance = parsed.currentBalance ?? 0;
      const balance = options.accountType === "CREDIT"
        ? -Math.abs(rawBalance)
        : rawBalance;

      const accountRow = {
        user_id: userId,
        external_id: externalAccountId,
        institution: options.institution,
        name: options.accountName,
        type: options.accountType,
        balance,
        currency: "BRL",
        is_active: true,
        last_synced_at: now,
      };

      const { data: upsertedAccount, error: accError } = await supabase
        .from("accounts")
        .upsert(accountRow, { onConflict: "external_id" })
        .select("id")
        .single();

      if (accError) {
        throw new Error(`Erro ao salvar conta: ${accError.message}`);
      }

      // For XLSX we don't have stable FITIDs. Use a hash-ish composite key
      // from date + description + amount so re-importing the same row is a no-op.
      // XLSX has no stable FITID. Build external_id from date+desc+amount
      // and append a counter if the same key repeats in this batch (e.g. two
      // iFood orders on the same day for the same price).
      const keyCounts = new Map<string, number>();
      const txRows = parsed.transactions.map((tx) => {
        const descHash = tx.description
          .slice(0, 40)
          .replace(/\s+/g, "_")
          .replace(/[^\w]/g, "");
        const baseKey = `xlsx:${options.accountIdentifier}:${tx.date}:${descHash}:${tx.amount}`;
        const count = (keyCounts.get(baseKey) ?? 0) + 1;
        keyCounts.set(baseKey, count);
        const externalId = count === 1 ? baseKey : `${baseKey}:n${count}`;
        return {
          user_id: userId,
          account_id: upsertedAccount.id,
          external_id: externalId,
          description: tx.description || "(sem descricao)",
          amount: tx.amount,
          type: tx.amount >= 0 ? "CREDIT" : "DEBIT",
          category_name: tx.category ?? null,
          date: tx.date,
          status: "CONFIRMED",
          is_recurring: false,
        };
      });

      if (txRows.length > 0) {
        const { error: txError } = await supabase
          .from("transactions")
          .upsert(txRows, { onConflict: "external_id" });
        if (txError) {
          throw new Error(`Erro ao salvar transacoes: ${txError.message}`);
        }
      }

      await refresh();
      return { transactionsImported: txRows.length };
    },
    [refresh],
  );

  const deleteAccount = useCallback(
    async (accountId: string) => {
      // Transactions and invoices have ON DELETE CASCADE → auto-removed
      const { error: delError } = await supabase
        .from("accounts")
        .delete()
        .eq("id", accountId);
      if (delError) {
        throw new Error(`Erro ao deletar conta: ${delError.message}`);
      }
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
        refresh,
        importOfx,
        importXlsx,
        deleteAccount,
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
