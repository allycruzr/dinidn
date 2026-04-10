// belvo-register-link
// Called by the frontend after the Belvo Connect Widget returns a successful link.
// Persists the link to belvo_links table (idempotent via upsert on belvo_link_id).
//
// NOTE: verify_jwt is DISABLED at gateway level due to a project-specific
// Edge Functions gateway issue. We validate the user manually inside.

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "missing_authorization" }, 401);
  }
  const jwt = authHeader.slice("Bearer ".length);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: userData, error: userError } = await authClient.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return jsonResponse({ error: "unauthorized", detail: userError?.message }, 401);
  }

  let body: { link_id?: string; institution?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const { link_id, institution } = body;
  if (!link_id || !institution) {
    return jsonResponse(
      { error: "missing_fields", detail: "link_id and institution are required" },
      400,
    );
  }

  // Use a user-scoped client for the insert so RLS policies apply
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { data, error } = await userClient
    .from("belvo_links")
    .upsert(
      {
        user_id: userData.user.id,
        belvo_link_id: link_id,
        institution,
        status: "valid",
        last_synced_at: null,
      },
      { onConflict: "belvo_link_id" },
    )
    .select()
    .single();

  if (error) {
    return jsonResponse({ error: "db_error", detail: error.message }, 500);
  }

  return jsonResponse({ belvo_link: data });
});
