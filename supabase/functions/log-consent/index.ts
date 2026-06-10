import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Entry {
  user_id: string;
  consent_type: "sms" | "email" | "baa";
  granted: boolean;
  consent_text: string;
  user_agent?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    const body = await req.json();
    const entries: Entry[] = Array.isArray(body?.entries) ? body.entries : [];
    if (entries.length === 0) {
      return new Response(JSON.stringify({ inserted: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only allow logging consents for self.
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      null;

    const sanitized = entries
      .filter((e) => e.user_id === callerId)
      .filter((e) => ["sms", "email", "baa"].includes(e.consent_type))
      .map((e) => ({
        user_id: callerId,
        consent_type: e.consent_type,
        granted: !!e.granted,
        consent_text: String(e.consent_text ?? "").slice(0, 2000),
        ip_address: ip,
        user_agent: String(e.user_agent ?? "").slice(0, 500),
      }));

    if (sanitized.length === 0) {
      return new Response(JSON.stringify({ inserted: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { error } = await admin.from("consent_log").insert(sanitized);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also update profile timestamp/ip for the latest grant of each type
    for (const row of sanitized) {
      if (row.consent_type === "sms") {
        await admin
          .from("profiles")
          .update({ sms_opt_in_ip: ip ?? null, sms_opt_in_at: new Date().toISOString() })
          .eq("id", callerId);
      } else if (row.consent_type === "email") {
        await admin
          .from("profiles")
          .update({ email_opt_in_ip: ip ?? null, email_opt_in_at: new Date().toISOString() })
          .eq("id", callerId);
      }
    }

    return new Response(JSON.stringify({ inserted: sanitized.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
