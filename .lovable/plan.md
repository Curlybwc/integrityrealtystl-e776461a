

# Enable Lovable Cloud + Repliers API Integration

## Step 1: Enable Lovable Cloud
Lovable Cloud should already be available for your workspace. When I proceed with implementation, the system will prompt you to approve enabling Cloud features (database, edge functions, secrets) for this project.

## Step 2: Store the Repliers API Key Securely
Once Cloud is enabled, I will use the secrets management tool to securely store your Repliers API key (`wzwvv2uaKeMRBNdg3DMWDI1WskkgKT`) as an environment variable called `REPLIERS_API_KEY`. This keeps it server-side only -- never exposed in the browser.

## Step 3: Create an Edge Function for MLS Data
Build a Supabase Edge Function (`fetch-mls-listings`) that:
- Reads `REPLIERS_API_KEY` from environment
- Calls the Repliers MLS API to search/fetch listings
- Returns normalized listing data to the frontend
- Includes proper CORS headers for browser calls

## Step 4: Frontend Integration
- Add a hook or service that calls the edge function from the admin portal
- Wire the response into the existing `createDeal()` flow from `screening.ts` so imported MLS listings are auto-screened

## Technical Details

### Edge Function: `supabase/functions/fetch-mls-listings/index.ts`
- Accepts search parameters (city, zip, price range, beds, etc.)
- Calls Repliers API with the stored key
- Maps Repliers response fields to our Deal schema
- Returns JSON array of normalized listings

### Config: `supabase/config.toml`
```text
[functions.fetch-mls-listings]
verify_jwt = false
```
JWT validation will be handled in code to allow flexible auth checking.

### Security
- API key stored as a Supabase secret, only accessible from edge functions
- Never sent to or visible in the browser
- Edge function validates caller authorization before returning data

