import { fetchSoldListings, type SoldReportRequest } from "./repliers-sold.ts";
import { getSoldReportCounty, validateSoldReportRange } from "./sold-report.ts";

export const soldReportCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CallerClient {
  auth: { getUser(): Promise<{ data: { user: { id: string } | null }; error: unknown }> };
  rpc(name: string, args: { _user_id: string; _role: string }): PromiseLike<{ data: unknown; error: unknown }>;
}

export function createFetchSoldListingsHandler(dependencies: {
  createCallerClient: (authorization: string) => CallerClient;
  getApiKey: () => string | undefined;
  fetchListings?: typeof fetchSoldListings;
}) {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...soldReportCorsHeaders, "Content-Type": "application/json" },
  });
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response(null, { headers: soldReportCorsHeaders });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const authorization = req.headers.get("Authorization");
    if (!authorization) return json({ error: "Missing authorization" }, 401);
    try {
      const caller = dependencies.createCallerClient(authorization);
      const { data, error } = await caller.auth.getUser();
      if (error || !data.user) return json({ error: "Unauthorized" }, 401);
      const { data: isAdmin, error: roleError } = await caller.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
      if (roleError || isAdmin !== true) return json({ error: "Admin access required" }, 403);

      let request: SoldReportRequest;
      try {
        const body = await req.json();
        getSoldReportCounty(body?.county);
        validateSoldReportRange(body?.fromDate, body?.toDate);
        request = { county: body.county, fromDate: body.fromDate, toDate: body.toDate };
      } catch {
        return json({ error: "Provide a supported county and valid fromDate/toDate in YYYY-MM-DD order" }, 400);
      }
      const apiKey = dependencies.getApiKey();
      if (!apiKey) return json({ error: "Sold listing service is not configured" }, 503);
      const rows = await (dependencies.fetchListings ?? fetchSoldListings)(request, apiKey);
      return json({ rows, count: rows.length });
    } catch {
      return json({ error: "Unable to complete the sold listing export. Please retry." }, 502);
    }
  };
}
