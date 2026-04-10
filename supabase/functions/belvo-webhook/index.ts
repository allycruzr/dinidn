// belvo-webhook
// Public endpoint (verify_jwt=false) that Belvo calls to notify about events:
// - LINKS: token_valid, token_invalid, delete_link
// - ACCOUNTS: new_accounts_available
// - TRANSACTIONS: new_transactions_available, transactions_updated, transactions_deleted
//
// On relevant events, triggers an internal resync of the affected link using
// the service_role key (bypasses RLS because there is no user context).
//
// TODO: verify HMAC signature using BELVO_WEBHOOK_SECRET before processing.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
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

// deno-lint-ignore no-explicit-any
async function syncLink(supabase: any, userId: string, linkUuid: string, belvoLinkId: string) {
  // Fetch accounts
  const accountsRes = await fetch(`${belvoBaseUrl()}/api/accounts/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: belvoAuthHeader(),
    },
    body: JSON.stringify({ link: belvoLinkId, save_data: true }),
  });

  if (!accountsRes.ok) {
    return { error: "belvo_accounts_error", status: accountsRes.status };
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
        belvo_link_id: linkUuid,
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
    await supabase
      .from("accounts")
      .upsert(accountRows, { onConflict: "belvo_account_id" });
  }

  // Fetch transactions (last 90 days)
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
    return { error: "belvo_transactions_error", status: txRes.status };
  }

  // deno-lint-ignore no-explicit-any
  const belvoTransactions = toArray(await txRes.json()) as any[];

  const { data: savedAccounts } = await supabase
    .from("accounts")
    .select("id, belvo_account_id")
    .eq("belvo_link_id", linkUuid);

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
    await supabase
      .from("transactions")
      .upsert(txRows, { onConflict: "belvo_transaction_id" });
  }

  await supabase
    .from("belvo_links")
    .update({ last_synced_at: now, status: "valid" })
    .eq("id", linkUuid);

  return { accounts: accountRows.length, transactions: txRows.length };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  // deno-lint-ignore no-explicit-any
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  console.log("[belvo-webhook] received:", JSON.stringify(payload));

  const belvoLinkId: string | undefined = payload.link_id;
  const webhookType: string | undefined = payload.webhook_type;
  const webhookCode: string | undefined = payload.webhook_code;

  if (!belvoLinkId) {
    return jsonResponse({ received: true, note: "no_link_id" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: linkRow } = await supabase
    .from("belvo_links")
    .select("id, user_id")
    .eq("belvo_link_id", belvoLinkId)
    .maybeSingle();

  if (!linkRow) {
    // Unknown link — ack anyway so Belvo does not retry forever
    return jsonResponse({ received: true, note: "unknown_link" });
  }

  // Link-level status updates
  if (webhookType === "LINKS") {
    let newStatus: string | null = null;
    if (webhookCode === "token_invalid") newStatus = "token_required";
    else if (webhookCode === "token_valid") newStatus = "valid";
    else if (webhookCode === "delete_link") newStatus = "deleted";

    if (newStatus) {
      await supabase
        .from("belvo_links")
        .update({ status: newStatus })
        .eq("id", linkRow.id);
    }
    return jsonResponse({ received: true, status_updated: newStatus });
  }

  // Data updates: full resync of the link
  if (webhookType === "TRANSACTIONS" || webhookType === "ACCOUNTS") {
    const result = await syncLink(
      supabase,
      linkRow.user_id,
      linkRow.id,
      belvoLinkId,
    );
    return jsonResponse({ received: true, sync: result });
  }

  return jsonResponse({ received: true });
});
