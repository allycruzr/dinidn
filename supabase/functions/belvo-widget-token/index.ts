// belvo-widget-token
// Exchanges backend Belvo credentials for a short-lived widget access token
// that the frontend can use to initialize the Belvo Connect Widget.
//
// Flow:
// 1. Authenticated user (verify_jwt=true) calls POST /functions/v1/belvo-widget-token
// 2. This function calls Belvo POST /api/token/ with our secret_id/password
// 3. Returns { access: "..." } — a JWT the widget will use
//
// Secrets required (set in Supabase Project Settings > Edge Functions > Secrets):
//   BELVO_SECRET_ID
//   BELVO_SECRET_PASSWORD
//   BELVO_ENV  ("sandbox" | "production")

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const secretId = Deno.env.get("BELVO_SECRET_ID");
  const secretPassword = Deno.env.get("BELVO_SECRET_PASSWORD");

  if (!secretId || !secretPassword) {
    return jsonResponse(
      { error: "missing_belvo_credentials" },
      500,
    );
  }

  try {
    const belvoResponse = await fetch(`${belvoBaseUrl()}/api/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: secretId,
        password: secretPassword,
        scopes:
          "read_institutions,write_links,read_consents,write_consents,read_consents_detail",
      }),
    });

    if (!belvoResponse.ok) {
      const detail = await belvoResponse.text();
      return jsonResponse(
        { error: "belvo_error", status: belvoResponse.status, detail },
        belvoResponse.status,
      );
    }

    const data = await belvoResponse.json();
    return jsonResponse({ access: data.access });
  } catch (err) {
    return jsonResponse(
      { error: "internal_error", detail: err instanceof Error ? err.message : String(err) },
      500,
    );
  }
});
