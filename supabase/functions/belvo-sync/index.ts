// belvo-sync
// Fetches accounts + transactions from Belvo for a given link and persists
// them to Postgres idempotently (upsert on Belvo IDs).
//
// Request:  POST { belvo_link_id: string }
// Response: { accounts: number, transactions: number }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const belvoBaseUrl = () => {
  const env = Deno.env.get("BELVO_ENV") ?? "sandbox";
  return env === "production"
    ? "https://api.belvo.com"
    : "https://sandbox.belvo.com";
};

const belvoAuthHeader = () => {
  const id = Deno.env.get("BELVO_SECRET_ID")!;
  const pwd = Deno.env.get("BELVO_SECRET_PASSWORD")!;
  return "Basic " + btoa(`${id}:${pwd}`);
};

type AccountType = "CHECKING" | "SAVINGS" | "CREDIT";

const mapAccountType = (belvoCategory: string | undefined): AccountType | null => {
  switch (belvoCategory) {
    case "CHECKING_ACCOUNT":
      return "CHECKING";
    case "SAVINGS_ACCOUNT":
      return "SAVINGS";
    case "CREDIT_CARD":
      return "CREDIT";
    default:
      return null;
  }
};

// deno-lint-ignore no-explicit-any
const toArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "missing_authorization" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }
  const userId = userData.user.id;

  let body: { belvo_link_id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const belvoLinkId = body.belvo_link_id;
  if (!belvoLinkId) {
    return jsonResponse({ error: "missing_belvo_link_id" }, 400);
  }

  // Verify the link belongs to the authenticated user (RLS enforces this)
  const { data: linkRow, error: linkError } = await supabase
    .from("belvo_links")
    .select("id, belvo_link_id")
    .eq("belvo_link_id", belvoLinkId)
    .maybeSingle();

  if (linkError) {
    return jsonResponse({ error: "db_error", detail: linkError.message }, 500);
  }
  if (!linkRow) {
    return jsonResponse({ error: "link_not_found" }, 404);
  }

  // 1. Fetch accounts from Belvo
  const accountsRes = await fetch(`${belvoBaseUrl()}/api/accounts/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: belvoAuthHeader(),
    },
    body: JSON.stringify({ link: belvoLinkId, save_data: true }),
  });

  if (!accountsRes.ok) {
    const detail = await accountsRes.text();
    return jsonResponse(
      { error: "belvo_accounts_error", status: accountsRes.status, detail },
      502,
    );
  }

  // deno-lint-ignore no-explicit-any
  const belvoAccounts = toArray(await accountsRes.json()) as any[];

  const now = new Date().toISOString();
  const accountRows = belvoAccounts
    .map((acc) => {
      const type = mapAccountType(acc.category);
      if (!type) return null;
      const currentBalance = Number(acc.balance?.current ?? 0);
      return {
        user_id: userId,
        belvo_link_id: linkRow.id,
        belvo_account_id: acc.id,
        institution: acc.institution?.name ?? "Unknown",
        name: acc.name ?? acc.number ?? "Account",
        type,
        balance: type === "CREDIT" ? -Math.abs(currentBalance) : currentBalance,
        credit_limit: acc.credit_data?.credit_limit ?? null,
        currency: acc.currency ?? "BRL",
        is_active: true,
        last_synced_at: now,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (accountRows.length > 0) {
    const { error: accUpsertError } = await supabase
      .from("accounts")
      .upsert(accountRows, { onConflict: "belvo_account_id" });

    if (accUpsertError) {
      return jsonResponse(
        { error: "db_accounts_upsert_error", detail: accUpsertError.message },
        500,
      );
    }
  }

  // 2. Fetch transactions (last 90 days)
  const dateTo = new Date().toISOString().split("T")[0];
  const dateFromDate = new Date();
  dateFromDate.setDate(dateFromDate.getDate() - 90);
  const dateFrom = dateFromDate.toISOString().split("T")[0];

  const txRes = await fetch(`${belvoBaseUrl()}/api/transactions/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: belvoAuthHeader(),
    },
    body: JSON.stringify({
      link: belvoLinkId,
      date_from: dateFrom,
      date_to: dateTo,
      save_data: true,
    }),
  });

  if (!txRes.ok) {
    const detail = await txRes.text();
    return jsonResponse(
      { error: "belvo_transactions_error", status: txRes.status, detail },
      502,
    );
  }

  // deno-lint-ignore no-explicit-any
  const belvoTransactions = toArray(await txRes.json()) as any[];

  // Build Belvo-ID -> local-UUID map for account lookup
  const { data: savedAccounts } = await supabase
    .from("accounts")
    .select("id, belvo_account_id")
    .eq("belvo_link_id", linkRow.id);

  const accountIdByBelvoId = new Map<string, string>();
  for (const a of savedAccounts ?? []) {
    if (a.belvo_account_id) accountIdByBelvoId.set(a.belvo_account_id, a.id);
  }

  const txRows = belvoTransactions
    .map((tx) => {
      const localAccountId = accountIdByBelvoId.get(tx.account?.id);
      if (!localAccountId) return null;
      const isInflow = tx.type === "INFLOW";
      const amount = Number(tx.amount ?? 0);
      const signedAmount = isInflow ? amount : -amount;
      return {
        user_id: userId,
        account_id: localAccountId,
        belvo_transaction_id: tx.id,
        description: tx.description ?? "(sem descricao)",
        amount: signedAmount,
        type: isInflow ? "CREDIT" : "DEBIT",
        category_name: tx.category ?? null,
        date: tx.value_date ?? tx.accounting_date,
        status: tx.status === "PENDING" ? "PENDING" : "CONFIRMED",
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null && !!r.date);

  if (txRows.length > 0) {
    const { error: txUpsertError } = await supabase
      .from("transactions")
      .upsert(txRows, { onConflict: "belvo_transaction_id" });

    if (txUpsertError) {
      return jsonResponse(
        { error: "db_transactions_upsert_error", detail: txUpsertError.message },
        500,
      );
    }
  }

  // 3. Update link last_synced_at
  await supabase
    .from("belvo_links")
    .update({ last_synced_at: now, status: "valid" })
    .eq("id", linkRow.id);

  return jsonResponse({
    accounts: accountRows.length,
    transactions: txRows.length,
  });
});
