// Edge function: analyze-repairs
// Enqueues a repair analysis for an MLS listing. Idempotent on evidence_hash.
// Sources: 'user' (quota-limited), 'admin' (priority 1), 'system_core' (priority 1, ingestion).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { enqueueWithQuota, getQuotaBlockedAnalysis, resolveRepairSource, type RepairSource } from "../_shared/repair-access.ts";
import { resolveExistingRepairAnalysis } from "../_shared/repair-enqueue.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REPLIERS_API_KEY = Deno.env.get("REPLIERS_API_KEY")!;

interface ListingSnapshot {
  mls_listing_id: string;
  address: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: number;
  year_built?: number;
  basement_finished_sqft?: number;
  remarks?: string;
  photo_urls: string[];
}

async function sha1(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizeRemarks(s: string | undefined): string {
  return (s ?? "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 2000);
}

async function computeEvidenceHash(l: ListingSnapshot): Promise<string> {
  const photos = [...(l.photo_urls ?? [])].sort().join("|");
  const payload = JSON.stringify({
    photos,
    remarks: normalizeRemarks(l.remarks),
    sqft: l.sqft || 0,
    beds: l.beds || 0,
    baths: l.baths || 0,
    basement: (l.basement_finished_sqft ?? 0) > 0,
  });
  return await sha1(payload);
}

async function fetchListing(mlsId: string): Promise<ListingSnapshot | null> {
  if (!REPLIERS_API_KEY) return null;
  const url = `https://api.repliers.io/listings/${encodeURIComponent(mlsId)}`;
  const resp = await fetch(url, { headers: { "REPLIERS-API-KEY": REPLIERS_API_KEY } });
  if (!resp.ok) {
    console.error("Repliers fetch failed", resp.status, await resp.text());
    return null;
  }
  const j = await resp.json();
  const listing = j.listing ?? j;
  const address = listing.address ?? {};
  const details = listing.details ?? {};
  const raw = listing.raw ?? {};
  const photos = listing.images ?? listing.photos ?? [];
  const aboveGradeSqft = raw.AboveGradeFinishedAreaSrchSqFt;
  return {
    mls_listing_id: listing.mlsNumber ?? listing.listingId ?? mlsId,
    address: `${address.streetNumber ?? ""} ${address.streetName ?? ""} ${address.streetSuffix ?? ""}`.trim(),
    zip: address.zip ?? address.postalCode ?? "",
    beds: parseInt(details.numBedrooms ?? details.bedrooms ?? "0", 10),
    baths: parseFloat(details.numBathrooms ?? details.bathrooms ?? "0"),
    sqft: parseInt(aboveGradeSqft ?? details.sqft ?? details.squareFeet ?? "0", 10),
    year_built: details.yearBuilt ? parseInt(details.yearBuilt, 10) : undefined,
    basement_finished_sqft: raw.BelowGradeFinishedAreaSrchSqFt ? parseInt(raw.BelowGradeFinishedAreaSrchSqFt, 10) : 0,
    remarks: details.description ?? listing.publicRemarks ?? raw.PublicRemarks ?? undefined,
    photo_urls: Array.isArray(photos)
      ? photos.slice(0, 24).map((p: any) => {
          const path = typeof p === "string" ? p : (p.url ?? p.photoUrl ?? "");
          if (!path) return "";
          return path.startsWith("http") ? path : `https://cdn.repliers.io/${path}`;
        }).filter(Boolean)
      : [],
  };
}

function kickWorker() {
  fetch(`${SUPABASE_URL}/functions/v1/process-repair-queue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + SERVICE_ROLE,
    },
    body: JSON.stringify({ trigger: "analyze-repairs" }),
  }).catch((e) => console.error("worker kick failed", e));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const mlsListingId: string = body?.mlsListingId;
    const requestedSource: unknown = body?.source;
    if (!mlsListingId || typeof mlsListingId !== "string") {
      return new Response(JSON.stringify({ error: "mlsListingId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // system_core bypasses user identity and quota; requires service-role bearer token
    const isServiceRole = authHeader === `Bearer ${SERVICE_ROLE}`;
    let userId: string | null = null;
    let source: RepairSource = requestedSource === "system_core" ? "system_core" : "user";
    if (requestedSource === "system_core") {
      if (!isServiceRole) {
        return new Response(JSON.stringify({ error: "system_core requires service role" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      userId = userData?.user?.id ?? null;
      if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (requestedSource === "admin") {
        source = await resolveRepairSource(requestedSource, userId, mlsListingId, async () => {
          const { data, error } = await userClient.rpc("has_role", { _user_id: userId, _role: "admin" });
          return !error && data === true;
        });
      }
    }


    const svc = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Load listing
    const listing = await fetchListing(mlsListingId);
    if (!listing) {
      return new Response(JSON.stringify({ error: "Listing not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const evidenceHash = await computeEvidenceHash(listing);

    // Check existing active row
    const { data: existing } = await svc
      .from("repair_analyses")
      .select("*")
      .eq("mls_listing_id", mlsListingId)
      .eq("is_active", true)
      .maybeSingle();

    if (existing) {
      const resolution = await resolveExistingRepairAnalysis(existing, evidenceHash, {
        requeue: async (id) => {
          const { data, error } = await svc
            .from("repair_analyses")
            .update({
              analysis_status: "pending",
              failure_reason: null,
              failure_kind: null,
              failure_detail: null,
              attempt_count: 0,
            })
            .eq("id", id)
            .eq("is_active", true)
            .eq("analysis_status", "failed")
            .select("*")
            .maybeSingle();
          return { data, error };
        },
        getActive: async (id) => {
          const { data } = await svc
            .from("repair_analyses")
            .select("*")
            .eq("id", id)
            .eq("is_active", true)
            .maybeSingle();
          return data;
        },
        archive: async (id) => {
          await svc.from("repair_analyses").update({ is_active: false }).eq("id", id);
        },
      });
      if (resolution.kind === "return") {
        if (resolution.kickWorker) kickWorker();
        return new Response(JSON.stringify({ analysis: resolution.analysis }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const pendingValues = {
      mls_listing_id: mlsListingId,
      evidence_hash: evidenceHash,
      analysis_status: "pending",
      requested_by: userId,
      priority: source === "user" ? 2 : 1,
      is_active: true,
      evidence_snapshot: {
        address: listing.address,
        zip: listing.zip,
        beds: listing.beds,
        baths: listing.baths,
        sqft: listing.sqft,
        year_built: listing.year_built,
        basement_finished_sqft: listing.basement_finished_sqft,
        remarks: listing.remarks,
        photo_urls: listing.photo_urls,
      },
    };
    const insertPending = () => svc.from("repair_analyses").insert(pendingValues).select("*").single();

    let pending: unknown;
    if (source === "user") {
      const monthKey = new Date().toISOString().slice(0, 7);
      const enqueueResult = await enqueueWithQuota({
        claim: async () => {
          const { data, error } = await svc.rpc("claim_ai_quota", { p_user_id: userId, p_month_key: monthKey });
          if (error) throw error;
          if (data !== null && !Number.isInteger(data)) throw new Error("Invalid quota claim result");
          return data as number | null;
        },
        insert: insertPending,
        refund: async () => {
          const { data, error } = await svc.rpc("refund_ai_quota", { p_user_id: userId, p_month_key: monthKey });
          if (error || data === null) throw error ?? new Error("Quota claim missing during refund");
          console.info("Refunded quota claim after pending insert failure", { userId, mlsListingId });
        },
        onExhausted: () => getQuotaBlockedAnalysis({
          findOwnSentinel: async () => {
            const { data } = await svc.from("repair_analyses")
              .select("*")
              .eq("mls_listing_id", mlsListingId)
              .eq("is_active", true)
              .eq("analysis_status", "quota_blocked")
              .eq("requested_by", userId)
              .maybeSingle();
            return data;
          },
          archiveDisplaceable: async () => {
            const { error } = await svc.from("repair_analyses")
              .update({ is_active: false })
              .eq("mls_listing_id", mlsListingId)
              .eq("is_active", true)
              .or(`requested_by.eq.${userId},analysis_status.in.(failed,quota_blocked)`);
            if (error) throw error;
          },
          findOtherLiveAnalysis: async () => {
            const { data } = await svc.from("repair_analyses")
              .select("*")
              .eq("mls_listing_id", mlsListingId)
              .eq("is_active", true)
              .in("analysis_status", ["pending", "analyzing", "complete"])
              .maybeSingle();
            return data;
          },
          insertSentinel: async () => {
            const { data, error } = await svc.from("repair_analyses").insert({
              mls_listing_id: mlsListingId,
              evidence_hash: evidenceHash,
              analysis_status: "quota_blocked",
              requested_by: userId,
              priority: 2,
              is_active: true,
            }).select("*").single();
            return { data, error };
          },
          findActiveAnalysis: async () => {
            const { data } = await svc.from("repair_analyses")
              .select("*")
              .eq("mls_listing_id", mlsListingId)
              .eq("is_active", true)
              .maybeSingle();
            return data;
          },
        }),
        logRefundFailure: (error) => console.error("Quota refund failed", { userId, mlsListingId, error }),
      });
      if (enqueueResult.kind === "exhausted") {
        return new Response(JSON.stringify({ analysis: enqueueResult.analysis }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (enqueueResult.error) {
        console.error("insert pending failed", enqueueResult.error);
        return new Response(JSON.stringify({ error: "Failed to queue analysis" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      pending = enqueueResult.data;
    } else {
      const { data, error } = await insertPending();
      if (error) {
        console.error("insert pending failed", error);
        return new Response(JSON.stringify({ error: "Failed to queue analysis" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      pending = data;
    }

    // Fire-and-forget worker kick (don't await)
    fetch(`${SUPABASE_URL}/functions/v1/process-repair-queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({ trigger: "analyze-repairs" }),
    }).catch((e) => console.error("worker kick failed", e));

    return new Response(JSON.stringify({ analysis: pending }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-repairs error", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
