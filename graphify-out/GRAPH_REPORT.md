# Graph Report - integrityrealtystl-e776461a  (2026-10-22)

## Corpus Check
- 302 files · ~143,155 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .css 2, (none) 1, .lock 1)

## Summary
- 1547 nodes · 5001 edges · 92 communities (69 shown, 23 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5b7fc699`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- lucide-react
- screening.ts
- dependencies
- cn
- zip-combobox.tsx
- Onboarding Requirements & Tiered Access
- DealUnderwritingPanel.tsx
- DealPotTable.tsx
- sidebar.tsx
- package.json
- DealAnalyzer.tsx
- lib/compArv.ts
- utils.ts
- BatchAnalysisTable.tsx
- Section8Calculator.tsx
- Badge
- repairAnalysis.ts
- DealAlertSettings.tsx
- devDependencies
- formatCurrency
- 20260309130000_admin_user_control_center.sql
- compilerOptions
- Reliability / Fragility / Consistency Audit
- 20261019090000_client_email_schedules.sql
- compReports.ts
- fetch-comp-arv/index.ts
- components.json
- ref_https
- compilerOptions
- carousel.tsx
- client.ts
- Daily Property Harvest – Implementation Plan
- form.tsx
- toast.tsx
- fetch-mls-listings/index.ts
- Repliers MLS API Reference
- chart.tsx
- AGENTS.md
- types.ts
- sheet.tsx
- useDeals
- compilerOptions
- 20260518204925_11b6b949-19f4-4e3f-9779-98095acb9075.sql
- class-variance-authority
- pagination.tsx
- repair-queue.ts
- navigation-menu.tsx
- scripts
- drawer.tsx
- InvestorPortalLayout.tsx
- 20260518212230_77cfae76-ddf9-4e2b-88fa-1d9b251d7daf.sql
- email-schedules.ts
- dotloop-send-baa/index.ts
- Welcome to your Lovable project
- send-deal-alert/index.ts
- Index.tsx
- useAccessTier
- vite.config.ts
- breadcrumb.tsx
- sonner.tsx
- Access tier model
- 20260518231855_ecf4842a-193b-4756-8bac-85b8268a90b1.sql
- PortalSelector.tsx
- previewAuthStorage.ts
- eslint.config.js
- CompArvPanel.tsx
- public-listing-response.ts
- useAccessTier.ts
- tailwindcss
- roadmap.md
- @testing-library/jest-dom
- compEvidence.ts
- scroll-area.tsx
- main.tsx
- public.get_cron_wake_token

## God Nodes (most connected - your core abstractions)
1. `cn()` - 260 edges
2. `Button` - 165 edges
3. `lucide-react` - 136 edges
4. `react` - 124 edges
5. `Input` - 87 edges
6. `Label` - 85 edges
7. `useToast()` - 71 edges
8. `App()` - 70 edges
9. `Card` - 70 edges
10. `CardContent` - 70 edges

## Surprising Connections (you probably didn't know these)
- `Recommended fix order` --references--> `useDeals()`  [INFERRED]
  AUDIT_REPORT.md → src/hooks/useDeals.tsx
- `1) Portal auth is inconsistent and effectively bypassed in multiple portal layouts` --references--> `usePortalAuth()`  [INFERRED]
  AUDIT_REPORT.md → src/hooks/usePortalAuth.ts
- `Search/Analyzer 5-run quota` --references--> `DealAnalyzer()`  [INFERRED]
  .lovable/plan.md → src/components/portal/DealAnalyzer.tsx
- `Frontend enforcement` --references--> `SaveDealButton()`  [INFERRED]
  .lovable/memory/architecture/auth/access-tier-model.md → src/components/portal/SaveDealButton.tsx
- `Tiered access model (Investor + Buyer)` --references--> `useAccessTier()`  [INFERRED]
  .lovable/plan.md → src/hooks/useAccessTier.ts

## Import Cycles
- None detected.

## Communities (92 total, 23 thin omitted)

### Community 0 - "Button"
Cohesion: 0.06
Nodes (138): react, react-router-dom, App(), queryClient, APPLIANCE_KEYS, FIELDS, NumericKey, RepairPricingEditor() (+130 more)

### Community 1 - "lucide-react"
Cohesion: 0.05
Nodes (46): lucide-react, BuyerDisclaimers(), BuyerHero(), BuyerProcess(), BuyerRepresentationDisclosure(), BuyerSearchCTA(), BuyerTestimonials(), BuyerValueProposition() (+38 more)

### Community 2 - "screening.ts"
Cohesion: 0.14
Nodes (17): @radix-ui/react-aspect-ratio, @tanstack/react-query, DetailRow(), ListingDetailBase(), ListingDetailBaseProps, RawListing, BatchAnalysisTable(), computeDealMetrics() (+9 more)

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (54): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, fflate, @fontsource/inter (+46 more)

### Community 4 - "cn"
Cohesion: 0.07
Nodes (46): @radix-ui/react-accordion, @radix-ui/react-avatar, @radix-ui/react-context-menu, @radix-ui/react-dropdown-menu, @radix-ui/react-menubar, AccordionContent, AccordionItem, AccordionTrigger (+38 more)

### Community 5 - "zip-combobox.tsx"
Cohesion: 0.10
Nodes (24): @radix-ui/react-dialog, GatedAction(), Props, tierRank, Command, CommandDialog(), CommandDialogProps, CommandEmpty (+16 more)

### Community 6 - "Onboarding Requirements & Tiered Access"
Cohesion: 0.14
Nodes (13): BAA requirement (Investor + Buyer only), Backend changes, Edge functions, New table: `analyzer_usage`, New table: `consent_log`, Onboarding Requirements & Tiered Access, Open items needing your input later (not blocking this build), Profile schema additions (+5 more)

### Community 7 - "DealUnderwritingPanel.tsx"
Cohesion: 0.09
Nodes (44): react-day-picker, DealUnderwritingPanel(), Metric(), moneyInput(), Props, AlertDialogAction, AlertDialogCancel, AlertDialogContent (+36 more)

### Community 8 - "DealPotTable.tsx"
Cohesion: 0.29
Nodes (9): DealPhotoViewer(), DealPhotoViewerProps, DealPotTableProps, ListingPhotoModal(), ListingPhotoModalProps, DialogHeader(), DialogTitle, Deal (+1 more)

### Community 9 - "sidebar.tsx"
Cohesion: 0.08
Nodes (28): Separator, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel (+20 more)

### Community 10 - "package.json"
Cohesion: 0.07
Nodes (28): name, private, type, version, autoprefixer, clsx, cmdk, date-fns (+20 more)

### Community 11 - "DealAnalyzer.tsx"
Cohesion: 0.14
Nodes (19): DealAnalyzer(), DealInputs, formatCurrency(), formatPercent(), InfoTooltip(), initialInputs, ResultRow(), ARV_PER_SF (+11 more)

### Community 12 - "lib/compArv.ts"
Cohesion: 0.14
Nodes (25): useCompArv(), ADJ, assignTier(), buildCompArv(), computeAdjustments(), detectSoftFlags(), Eligibility, evaluateEligibility() (+17 more)

### Community 13 - "utils.ts"
Cohesion: 0.07
Nodes (19): input-otp, @radix-ui/react-hover-card, @radix-ui/react-progress, @radix-ui/react-radio-group, @radix-ui/react-slider, react-resizable-panels, NavLink, NavLinkCompatProps (+11 more)

### Community 14 - "BatchAnalysisTable.tsx"
Cohesion: 0.21
Nodes (13): AnalyzedListing, BatchAnalysisTableProps, SortField, StrategyFilter, strategyOrder, ViewMode, ListingCard(), ListingCardProps (+5 more)

### Community 15 - "Section8Calculator.tsx"
Cohesion: 0.17
Nodes (15): CompReportStatus(), formatCurrency(), STATUS_CLASS, STATUS_LABEL, timeAgo(), formatCurrency(), InfoTooltip(), initialInputs (+7 more)

### Community 16 - "Badge"
Cohesion: 0.29
Nodes (10): @radix-ui/react-tabs, DealPotTable(), SendDealAlertPanel(), Badge(), BadgeProps, badgeVariants, TabsContent, TabsList (+2 more)

### Community 17 - "repairAnalysis.ts"
Cohesion: 0.16
Nodes (15): Props, RepairBreakdownPanel(), RepairQuotaChip(), useRepairAnalysis(), UseRepairAnalysisOpts, AnalysisStatus, fetchActiveAnalysesBulk(), fetchActiveAnalysis() (+7 more)

### Community 18 - "DealAlertSettings.tsx"
Cohesion: 0.23
Nodes (16): @radix-ui/react-switch, DealAlertSettings(), SOURCES, STRATEGIES, Switch, disablePushOnThisDevice(), enablePushOnThisDevice(), encodeKey() (+8 more)

### Community 19 - "devDependencies"
Cohesion: 0.09
Nodes (22): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom (+14 more)

### Community 20 - "formatCurrency"
Cohesion: 0.23
Nodes (15): CheckMlsUpdatesButton(), Chip(), LiveSnapshot, Props, SaveDealButton(), formatCurrency(), formatPercent(), getScoringStatus() (+7 more)

### Community 21 - "20260309130000_admin_user_control_center.sql"
Cohesion: 0.06
Nodes (44): public.has_role(), public.user_roles, public.has_role(), user_roles_user_id_role_key, admin_audit_log_actor_idx, admin_audit_log_created_at_idx, admin_audit_log_target_idx, on_auth_user_created_profile (+36 more)

### Community 22 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+12 more)

### Community 23 - "Reliability / Fragility / Consistency Audit"
Cohesion: 0.08
Nodes (23): 10) Missing evidence for RLS/auth coupling and deploy-time env validation, 11) Duplicate toast hook paths may confuse imports, 1) Portal auth is inconsistent and effectively bypassed in multiple portal layouts, 2) Deals persistence skips saving empty arrays, 3) Edge function logs raw listing payloads and partial JSON, 4) Login pages imply auth, but portal access logic is not truly connected, 5) Dual lockfiles (`package-lock.json`, `bun.lock`, `bun.lockb`), 6) `any` usage in API error handling and listing normalization (+15 more)

### Community 24 - "20261019090000_client_email_schedules.sql"
Cohesion: 0.60
Nodes (5): client_email_schedule_sends_cadence_bucket_key, client_email_schedule_sends_schedule_time_idx, client_email_schedule_sends_successful_window_idx, public.client_email_schedule_sends, public.client_email_schedules

### Community 25 - "compReports.ts"
Cohesion: 0.17
Nodes (25): Props, useCompReport(), UseCompReportArgs, UseCompReportReturn, buildSummary(), closeReport(), CompReportRow, computeSnapshotStatus() (+17 more)

### Community 26 - "fetch-comp-arv/index.ts"
Cohesion: 0.16
Nodes (17): ADJ, adjust(), assignTier(), CompTier, corsHeaders, EligibilityStage, evalElig(), FinishTier (+9 more)

### Community 27 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 28 - "ref_https"
Cohesion: 0.12
Nodes (9): corsHeaders, ALLOWED_ROLES, corsHeaders, corsHeaders, ALLOWED, corsHeaders, corsHeaders, corsHeaders (+1 more)

### Community 29 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+7 more)

### Community 30 - "carousel.tsx"
Cohesion: 0.17
Nodes (14): embla-carousel-react, Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext (+6 more)

### Community 31 - "client.ts"
Cohesion: 0.20
Nodes (9): AdminPortalLayout(), navItems, AnalyzerTool, MOCK_USERS, PORTAL_REQUIRED_ROLES, PortalType, PortalUser, UseUserRolesResult (+1 more)

### Community 32 - "Daily Property Harvest – Implementation Plan"
Cohesion: 0.14
Nodes (13): 1. Database Table: `deals`, 2. Edge Function: `daily-mls-harvest`, 3. Cron Schedule, 4. Frontend: `/deals` Page, 5. Admin Trigger, Behavior, Columns, Daily Property Harvest – Implementation Plan (+5 more)

### Community 33 - "form.tsx"
Cohesion: 0.19
Nodes (12): @radix-ui/react-label, react-hook-form, FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext (+4 more)

### Community 34 - "toast.tsx"
Cohesion: 0.26
Nodes (11): @radix-ui/react-toast, Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle (+3 more)

### Community 35 - "fetch-mls-listings/index.ts"
Cohesion: 0.23
Nodes (10): buildRepliersUrl(), corsHeaders, fetchSingleZip(), lookupCountySqft(), mapStatus(), normalizeAddress(), normalizeListing(), STL_COUNTY_ZIPS (+2 more)

### Community 36 - "Repliers MLS API Reference"
Cohesion: 0.17
Nodes (11): Authentication, Base URL, Docs Links, Endpoints, Get Single Listing: `GET /listings/{mlsNumber}`, Memory: integrations/repliers-mls-api, Our Edge Function Mapping, Repliers MLS API Reference (+3 more)

### Community 37 - "chart.tsx"
Cohesion: 0.24
Nodes (11): recharts, ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartStyle(), ChartTooltipContent (+3 more)

### Community 39 - "types.ts"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 40 - "sheet.tsx"
Cohesion: 0.24
Nodes (9): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants (+1 more)

### Community 41 - "useDeals"
Cohesion: 0.32
Nodes (9): loadDeals(), MOCK_DEALS, resetDeals(), SAMPLE_PHOTOS, saveDeals(), DealTab, useDeals(), updateDeal() (+1 more)

### Community 42 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowJs, noImplicitAny, noUnusedLocals, noUnusedParameters, paths, skipLibCheck, strictNullChecks (+2 more)

### Community 43 - "20260518204925_11b6b949-19f4-4e3f-9779-98095acb9075.sql"
Cohesion: 0.31
Nodes (7): comp_reports_active_uniq, comp_reports_mls_idx, comp_reports_property_refreshed_idx, comp_reports_status_idx, public.comp_reports, update_comp_report_overrides_updated_at, update_comp_reports_updated_at

### Community 44 - "class-variance-authority"
Cohesion: 0.18
Nodes (12): class-variance-authority, @radix-ui/react-toggle, @radix-ui/react-toggle-group, Alert, AlertDescription, AlertTitle, alertVariants, ToggleGroup (+4 more)

### Community 45 - "pagination.tsx"
Cohesion: 0.24
Nodes (9): ButtonProps, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem, PaginationLink(), PaginationLinkProps, PaginationNext() (+1 more)

### Community 46 - "repair-queue.ts"
Cohesion: 0.06
Nodes (39): NOW, computeEvidenceHash(), corsHeaders, ListingSnapshot, normalizeRemarks(), sha1(), callVision(), clamp01() (+31 more)

### Community 47 - "navigation-menu.tsx"
Cohesion: 0.28
Nodes (8): @radix-ui/react-navigation-menu, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 48 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:dev, dev, lint, preview, test, test:watch

### Community 49 - "drawer.tsx"
Cohesion: 0.25
Nodes (7): vaul, DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 50 - "InvestorPortalLayout.tsx"
Cohesion: 0.26
Nodes (9): Footer(), PartnerPortalLayout(), AccessTierBanner(), Props, InvestorPortalLayout(), navItems, navItems, WholesalerPortalLayout() (+1 more)

### Community 51 - "20260518212230_77cfae76-ddf9-4e2b-88fa-1d9b251d7daf.sql"
Cohesion: 0.32
Nodes (5): ai_analysis_quota_updated_at, public.repair_pricing_rules, repair_analyses_updated_at, repair_pricing_rules_active_uniq, repair_pricing_rules_version_uniq

### Community 52 - "email-schedules.ts"
Cohesion: 0.06
Nodes (52): fflate, @supabase/supabase-js, @testing-library/react, vitest, reportDetails(), { from, loadSchedules, update, eq, selectUpdate, saveSchedule }, schedule, { invoke, buildSoldExport } (+44 more)

### Community 53 - "dotloop-send-baa/index.ts"
Cohesion: 0.25
Nodes (5): corsHeaders, DOTLOOP_BAA_TEMPLATE_ID, DOTLOOP_PROFILE_ID, DOTLOOP_TOKEN, DotloopSendResult

### Community 54 - "Welcome to your Lovable project"
Cohesion: 0.29
Nodes (6): Can I connect a custom domain to my Lovable project?, How can I deploy this project?, How can I edit this code?, Project info, Welcome to your Lovable project, What technologies are used for this project?

### Community 56 - "Index.tsx"
Cohesion: 0.29
Nodes (7): AboutSection(), AudienceCard(), AudienceCardProps, audiences, AudienceSection(), HeroSection(), Index()

### Community 57 - "useAccessTier"
Cohesion: 0.47
Nodes (8): Frontend enforcement, Build order, PreviewQuotaChip(), PreviewQuotaGate(), Props, useAccessTier(), useAnalyzerQuota(), PortalAnalyzer()

### Community 58 - "vite.config.ts"
Cohesion: 0.40
Nodes (3): lovable-tagger, vite, @vitejs/plugin-react-swc

### Community 59 - "breadcrumb.tsx"
Cohesion: 0.22
Nodes (8): @radix-ui/react-slot, Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 60 - "sonner.tsx"
Cohesion: 0.40
Nodes (4): next-themes, sonner, Toaster(), ToasterProps

### Community 61 - "Access tier model"
Cohesion: 0.29
Nodes (6): Access tier model, Backend enforcement, Dotloop integration (not yet wired), Onboarding wizard, Profile fields added, Required at signup (`src/pages/Signup.tsx`)

### Community 62 - "20260518231855_ecf4842a-193b-4756-8bac-85b8268a90b1.sql"
Cohesion: 0.70
Nodes (4): idx_saved_deals_property_key, idx_saved_deals_user, public.saved_deals, trg_saved_deals_updated_at

### Community 63 - "PortalSelector.tsx"
Cohesion: 0.38
Nodes (5): useHasRole(), UseHasRoleResult, useUserRoles(), allPortals, PortalSelector()

### Community 64 - "previewAuthStorage.ts"
Cohesion: 0.33
Nodes (6): brokeredPreviewStorage(), BrokerReply, BrokerRequest, BrokerRequestType, PreviewAuthStorage, readBrokerReply()

### Community 65 - "eslint.config.js"
Cohesion: 0.33
Nodes (5): @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

### Community 66 - "CompArvPanel.tsx"
Cohesion: 0.31
Nodes (6): @radix-ui/react-collapsible, CompArvPanel(), CompRow(), fmt(), Props, tierColor

### Community 67 - "public-listing-response.ts"
Cohesion: 0.70
Nodes (3): listingServiceError(), shapePublicListing(), shapeSingleListing()

### Community 68 - "useAccessTier.ts"
Cohesion: 0.50
Nodes (3): AccessTier, AccessTierProfile, UseAccessTierResult

### Community 86 - "compEvidence.ts"
Cohesion: 0.33
Nodes (7): buildCompEvidence(), caveats(), CompEvidenceRow, driverSet(), relevanceReasons(), CompTier, ScoredComp

### Community 87 - "scroll-area.tsx"
Cohesion: 0.67
Nodes (3): @radix-ui/react-scroll-area, ScrollArea, ScrollBar

## Knowledge Gaps
- **14 isolated node(s):** `@fontsource/inter`, `@fontsource/playfair-display`, `@hookform/resolvers`, `date-fns`, `tailwindcss-animate` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 494 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `Button`, `screening.ts`, `zip-combobox.tsx`, `DealUnderwritingPanel.tsx`, `DealPotTable.tsx`, `sidebar.tsx`, `utils.ts`, `BatchAnalysisTable.tsx`, `Section8Calculator.tsx`, `Badge`, `DealAlertSettings.tsx`, `formatCurrency`, `carousel.tsx`, `client.ts`, `form.tsx`, `toast.tsx`, `chart.tsx`, `sheet.tsx`, `class-variance-authority`, `pagination.tsx`, `navigation-menu.tsx`, `drawer.tsx`, `InvestorPortalLayout.tsx`, `breadcrumb.tsx`, `scroll-area.tsx`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **What connects `@fontsource/inter`, `@fontsource/playfair-display`, `@hookform/resolvers` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.06331446623667238 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `Button`, `screening.ts`, `cn`, `zip-combobox.tsx`, `DealUnderwritingPanel.tsx`, `DealPotTable.tsx`, `sidebar.tsx`, `package.json`, `DealAnalyzer.tsx`, `utils.ts`, `BatchAnalysisTable.tsx`, `Section8Calculator.tsx`, `Badge`, `repairAnalysis.ts`, `DealAlertSettings.tsx`, `formatCurrency`, `carousel.tsx`, `client.ts`, `toast.tsx`, `sheet.tsx`, `useDeals`, `pagination.tsx`, `navigation-menu.tsx`, `InvestorPortalLayout.tsx`, `Index.tsx`, `useAccessTier`, `breadcrumb.tsx`, `PortalSelector.tsx`, `CompArvPanel.tsx`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.05034199726402189 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `screening.ts`, `cn`, `zip-combobox.tsx`, `DealUnderwritingPanel.tsx`, `DealPotTable.tsx`, `sidebar.tsx`, `package.json`, `DealAnalyzer.tsx`, `lib/compArv.ts`, `utils.ts`, `BatchAnalysisTable.tsx`, `Section8Calculator.tsx`, `Badge`, `repairAnalysis.ts`, `DealAlertSettings.tsx`, `formatCurrency`, `compReports.ts`, `carousel.tsx`, `client.ts`, `form.tsx`, `toast.tsx`, `chart.tsx`, `sheet.tsx`, `useDeals`, `class-variance-authority`, `pagination.tsx`, `navigation-menu.tsx`, `drawer.tsx`, `InvestorPortalLayout.tsx`, `useAccessTier`, `breadcrumb.tsx`, `PortalSelector.tsx`, `CompArvPanel.tsx`, `useAccessTier.ts`, `scroll-area.tsx`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Should `screening.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._