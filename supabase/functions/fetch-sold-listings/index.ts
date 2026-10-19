import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createFetchSoldListingsHandler } from "../_shared/fetch-sold-listings-handler.ts";

// As with existing admin functions, validate the caller's JWT with getUser and
// check the admin role with has_role before contacting the MLS provider.
Deno.serve(createFetchSoldListingsHandler({
  createCallerClient: (authorization) => createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization } } },
  ),
  getApiKey: () => Deno.env.get("REPLIERS_API_KEY"),
}));
