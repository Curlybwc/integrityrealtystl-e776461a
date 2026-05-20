## Add "Switch Portal" button to all portal layouts

Add a new **Switch Portal** button next to the existing **Exit Portal** / **Sign Out** button in every portal header/sidebar. It routes to `/portals` so users can pick a different portal without leaving the authenticated area.

Existing behavior preserved:
- Logo → still links to current portal dashboard (e.g., `/portal/investor`)
- Exit Portal / Sign Out → still goes to `/` (or `/wholesalers` for wholesaler)
- Public site Header logo → still goes to `/`

### Files to update

1. **`src/components/portal/InvestorPortalLayout.tsx`** — add Switch Portal button in header
2. **`src/components/admin-portal/AdminPortalLayout.tsx`** — add Switch Portal button in header
3. **`src/components/partner-portal/PartnerPortalLayout.tsx`** — add Switch Portal button next to Exit Portal
4. **`src/components/wholesaler-portal/WholesalerPortalLayout.tsx`** — add Switch Portal button next to Sign Out

### UI detail

- Label: **Switch Portal**
- Icon: `LayoutGrid` (or `Repeat`) from lucide-react
- Style: `variant="ghost"` `size="sm"`, matches existing Exit/Sign Out buttons
- Mobile: icon only (hide label under `sm:`), same pattern as Exit Portal
- Links to `/portals`
