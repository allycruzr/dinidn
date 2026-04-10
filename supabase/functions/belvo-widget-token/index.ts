// belvo-widget-token
// Exchanges backend Belvo credentials for a short-lived widget access token.
//
// NOTE: verify_jwt is DISABLED at gateway level because this project had
// persistent 401 "Invalid JWT" errors from the gateway. We validate the user
// manually inside the function by calling supabase.auth.getUser(jwt).
//
// Secrets required:
//   BELVO_SECRET_ID
//   BELVO_SECRET_PASSWORD
//   BELVO_ENV

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  // Manual auth: read JWT from header and validate
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "missing_authorization" }, 401);
  }
  const jwt = authHeader.slice("Bearer ".length);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return jsonResponse({ error: "unauthorized", detail: userError?.message }, 401);
  }

  const secretId = Deno.env.get("BELVO_SECRET_ID");
  const secretPassword = Deno.env.get("BELVO_SECRET_PASSWORD");

  if (!secretId || !secretPassword) {
    return jsonResponse({ error: "missing_belvo_credentials" }, 500);
  }

  try {
    const belvoResponse = await fetch(`${belvoBaseUrl()}/api/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: secretId,
        password: secretPassword,
        scopes: "read_institutions,write_links,read_consents,write_consents",
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
