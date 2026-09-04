import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DealPayload = {
  key: string;
  address?: string;
  city?: string;
  zip?: string;
  price?: number;
  beds?: number;
  strategy?: string;
  source?: string;
  url?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function matches(pref: Record<string, unknown>, deal: DealPayload): boolean {
  const min = pref.min_price as number | null;
  const max = pref.max_price as number | null;
  const zips = (pref.zip_codes as string[]) ?? [];
  const strategies = (pref.strategies as string[]) ?? [];
  const sources = (pref.sources as string[]) ?? [];
  const minBeds = pref.min_beds as number | null;

  if (typeof deal.price === "number") {
    if (min != null && deal.price < min) return false;
    if (max != null && deal.price > max) return false;
  }
  if (zips.length && deal.zip && !zips.includes(deal.zip)) return false;
  if (strategies.length && deal.strategy && !strategies.includes(deal.strategy)) return false;
  if (sources.length && deal.source && !sources.includes(deal.source)) return false;
  if (minBeds != null && typeof deal.beds === "number" && deal.beds < minBeds) return false;
  return true;
}

async function sendSms(to: string, body: string): Promise<boolean> {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_PHONE_NUMBER");
  if (!sid || !token || !from) return false;

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${sid}:${token}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  if (!res.ok) {
    console.error("twilio send failed", res.status);
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await caller.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const svc = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await svc.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const { deal } = (await req.json()) as { deal: DealPayload };
    if (!deal?.key) return json({ error: "Missing deal" }, 400);

    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:info@integrityrealtystl.com";
    if (vapidPublic && vapidPrivate) {
      webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
    }

    // Investors who opted in
    const { data: investorRoles } = await svc
      .from("user_roles")
      .select("user_id")
      .eq("role", "investor");
    const investorIds = (investorRoles ?? []).map((r: { user_id: string }) => r.user_id);
    if (!investorIds.length) return json({ recipients: 0, push_sent: 0, sms_sent: 0 });

    const { data: prefs } = await svc
      .from("alert_preferences")
      .select("*")
      .in("user_id", investorIds);

    const targeted = (prefs ?? []).filter((p: Record<string, unknown>) => matches(p, deal));
    const targetIds = targeted.map((p: Record<string, string>) => p.user_id);
    if (!targetIds.length) return json({ recipients: 0, push_sent: 0, sms_sent: 0 });

    const priceText =
      typeof deal.price === "number" ? `$${deal.price.toLocaleString("en-US")}` : "";
    const where = [deal.address, deal.city].filter(Boolean).join(", ");
    const title = "New deal alert";
    const body = [where, priceText].filter(Boolean).join(" — ") || "A new deal is available.";
    const url = deal.url ?? "/portal/investor/deal-alerts";

    // Push
    let pushSent = 0;
    const pushIds = targeted
      .filter((p: Record<string, boolean>) => p.push_enabled)
      .map((p: Record<string, string>) => p.user_id);

    if (pushIds.length && vapidPublic && vapidPrivate) {
      const { data: subs } = await svc
        .from("push_subscriptions")
        .select("*")
        .in("user_id", pushIds);

      for (const sub of subs ?? []) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({ title, body, url, tag: deal.key }),
          );
          pushSent++;
          await svc
            .from("push_subscriptions")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", sub.id);
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await svc.from("push_subscriptions").delete().eq("id", sub.id);
          } else {
            console.error("push failed", status);
          }
        }
      }
    }

    // SMS
    let smsSent = 0;
    const smsIds = targeted
      .filter((p: Record<string, boolean>) => p.sms_enabled)
      .map((p: Record<string, string>) => p.user_id);

    if (smsIds.length) {
      const { data: people } = await svc
        .from("profiles")
        .select("id, phone, sms_opt_in")
        .in("id", smsIds);

      for (const person of people ?? []) {
        if (!person.sms_opt_in || !person.phone) continue;
        const ok = await sendSms(
          person.phone,
          `Integrity Realty STL — new deal: ${body}. View: https://integrityrealtystl.com${url}. Reply STOP to opt out.`,
        );
        if (ok) smsSent++;
      }
    }

    await svc.from("deal_alerts_sent").insert({
      deal_key: deal.key,
      deal_address: deal.address ?? null,
      deal_price: deal.price ?? null,
      deal_zip: deal.zip ?? null,
      sent_by: userData.user.id,
      recipient_count: targetIds.length,
      push_sent: pushSent,
      sms_sent: smsSent,
    });

    return json({
      recipients: targetIds.length,
      push_sent: pushSent,
      sms_sent: smsSent,
      sms_configured: !!Deno.env.get("TWILIO_ACCOUNT_SID"),
    });
  } catch (e) {
    console.error("send-deal-alert error", e);
    return json({ error: "Unable to send deal alert." }, 500);
  }
});
