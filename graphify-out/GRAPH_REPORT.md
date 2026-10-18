# Graph Report - integrity-repo  (2026-10-18)

## Corpus Check
- 276 files · ~128,030 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .css 2, (none) 1, .lock 1)

## Summary
- 1414 nodes · 4638 edges · 85 communities (61 shown, 24 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Button
- lucide-react
- Card
- dependencies
- cn
- DealPhotoViewer.tsx
- PortalSearchAnalyzer.tsx
- DealUnderwritingPanel.tsx
- Badge
- sidebar.tsx
- package.json
- DealAnalyzer.tsx
- compReports.ts
- utils.ts
- BatchAnalysisTable.tsx
- useDeals
- lib/compArv.ts
- repairAnalysis.ts
- InvestorPortalLayout.tsx
- devDependencies
- Section8Calculator.tsx
- 20260309130000_admin_user_control_center.sql
- compilerOptions
- Reliability / Fragility / Consistency Audit
- CompArvPanel.tsx
- DealAlertSettings.tsx
- fetch-comp-arv/index.ts
- components.json
- ref_https
- compilerOptions
- carousel.tsx
- PortalPartnerProfile.tsx
- Daily Property Harvest – Implementation Plan
- form.tsx
- toast.tsx
- fetch-mls-listings/index.ts
- Repliers MLS API Reference
- chart.tsx
- Index.tsx
- 20260610193325_b5c38f28-c644-4c8a-aaef-5bb77537f83a.sql
- sheet.tsx
- types.ts
- compilerOptions
- 20260518204925_11b6b949-19f4-4e3f-9779-98095acb9075.sql
- class-variance-authority
- pagination.tsx
- process-repair-queue/index.ts
- navigation-menu.tsx
- breadcrumb.tsx
- drawer.tsx
- scripts
- 20260518212230_77cfae76-ddf9-4e2b-88fa-1d9b251d7daf.sql
- vitest
- dotloop-send-baa/index.ts
- Welcome to your Lovable project
- send-deal-alert/index.ts
- analyze-repairs/index.ts
- 20260313202934_3a069b5a-7922-4625-a790-d33f07d4f0a3.sql
- eslint.config.js
- 20260904233540_7a273280-f5c3-439a-ac44-3b4b4fab29b9.sql
- sonner.tsx
- 20260309120000_harden_user_roles_auth.sql
- 20260518231855_ecf4842a-193b-4756-8bac-85b8268a90b1.sql
- public.user_roles
- on_auth_user_created_assign_first_user_roles
- public.user_roles
- main.tsx
- public.admin_list_users
- tailwindcss
- @testing-library/jest-dom
- roadmap.md

## God Nodes (most connected - your core abstractions)
1. `cn()` - 260 edges
2. `Button` - 161 edges
3. `lucide-react` - 134 edges
4. `react` - 122 edges
5. `Input` - 87 edges
6. `Label` - 83 edges
7. `useToast()` - 71 edges
8. `App()` - 68 edges
9. `Card` - 66 edges
10. `CardContent` - 66 edges

## Surprising Connections (you probably didn't know these)
- `Recommended fix order` --references--> `useDeals()`  [INFERRED]
  AUDIT_REPORT.md → src/hooks/useDeals.tsx
- `Search/Analyzer 5-run quota` --references--> `DealAnalyzer()`  [INFERRED]
  .lovable/plan.md → src/components/portal/DealAnalyzer.tsx
- `Frontend enforcement` --references--> `SaveDealButton()`  [INFERRED]
  .lovable/memory/architecture/auth/access-tier-model.md → src/components/portal/SaveDealButton.tsx
- `Test gaps` --references--> `useDeals()`  [INFERRED]
  AUDIT_REPORT.md → src/hooks/useDeals.tsx
- `Test gaps` --references--> `useMlsSearch()`  [INFERRED]
  AUDIT_REPORT.md → src/hooks/useMlsSearch.tsx

## Import Cycles
- None detected.

## Communities (85 total, 24 thin omitted)

### Community 0 - "Button"
Cohesion: 0.07
Nodes (107): react, react-router-dom, @tanstack/react-query, App(), queryClient, AdminPortalLayout(), APPLIANCE_KEYS, FIELDS (+99 more)

### Community 1 - "lucide-react"
Cohesion: 0.06
Nodes (39): lucide-react, BuyerDisclaimers(), BuyerHero(), BuyerProcess(), BuyerRepresentationDisclosure(), BuyerSearchCTA(), BuyerTestimonials(), BuyerValueProposition() (+31 more)

### Community 2 - "Card"
Cohesion: 0.13
Nodes (43): DealPotTable(), RepairBreakdownPanel(), UtilityAllowanceCalculator(), Card, CardContent, CardDescription, CardHeader, CardTitle (+35 more)

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (53): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, @fontsource/inter, @fontsource/playfair-display (+45 more)

### Community 4 - "cn"
Cohesion: 0.06
Nodes (46): @radix-ui/react-accordion, @radix-ui/react-avatar, @radix-ui/react-context-menu, @radix-ui/react-dropdown-menu, @radix-ui/react-menubar, @radix-ui/react-radio-group, AccordionContent, AccordionItem (+38 more)

### Community 5 - "DealPhotoViewer.tsx"
Cohesion: 0.09
Nodes (30): cmdk, @radix-ui/react-popover, DealPhotoViewer(), GatedAction(), Props, tierRank, ListingPhotoModal(), ListingPhotoModalProps (+22 more)

### Community 6 - "PortalSearchAnalyzer.tsx"
Cohesion: 0.08
Nodes (34): Access tier model, Backend enforcement, Dotloop integration (not yet wired), Frontend enforcement, Onboarding wizard, Profile fields added, Required at signup (`src/pages/Signup.tsx`), BAA requirement (Investor + Buyer only) (+26 more)

### Community 7 - "DealUnderwritingPanel.tsx"
Cohesion: 0.16
Nodes (29): DealUnderwritingPanel(), Metric(), moneyInput(), Props, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription (+21 more)

### Community 8 - "Badge"
Cohesion: 0.16
Nodes (23): DetailRow(), ListingDetailBase(), ListingDetailBaseProps, RawListing, CheckMlsUpdatesButton(), Chip(), LiveSnapshot, Props (+15 more)

### Community 9 - "sidebar.tsx"
Cohesion: 0.08
Nodes (27): SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader (+19 more)

### Community 10 - "package.json"
Cohesion: 0.07
Nodes (29): name, private, type, version, autoprefixer, clsx, date-fns, eslint (+21 more)

### Community 11 - "DealAnalyzer.tsx"
Cohesion: 0.11
Nodes (25): DealAnalyzer(), DealInputs, formatCurrency(), formatPercent(), InfoTooltip(), initialInputs, ResultRow(), Alert (+17 more)

### Community 12 - "compReports.ts"
Cohesion: 0.16
Nodes (26): Props, useCompArv(), useCompReport(), UseCompReportArgs, UseCompReportReturn, buildSummary(), closeReport(), CompReportRow (+18 more)

### Community 13 - "utils.ts"
Cohesion: 0.07
Nodes (20): input-otp, @radix-ui/react-hover-card, @radix-ui/react-scroll-area, @radix-ui/react-slider, react-day-picker, react-resizable-panels, NavLink, NavLinkCompatProps (+12 more)

### Community 14 - "BatchAnalysisTable.tsx"
Cohesion: 0.14
Nodes (23): AnalyzedListing, BatchAnalysisTable(), BatchAnalysisTableProps, SortField, StrategyFilter, strategyOrder, ViewMode, ListingCardProps (+15 more)

### Community 15 - "useDeals"
Cohesion: 0.16
Nodes (19): @radix-ui/react-tabs, DealPhotoViewerProps, DealPotTableProps, SendDealAlertPanel(), TabsContent, TabsList, TabsTrigger, loadDeals() (+11 more)

### Community 16 - "lib/compArv.ts"
Cohesion: 0.14
Nodes (24): ADJ, assignTier(), buildCompArv(), computeAdjustments(), detectSoftFlags(), Eligibility, evaluateEligibility(), HARD_DISTRESS_STATUSES (+16 more)

### Community 17 - "repairAnalysis.ts"
Cohesion: 0.12
Nodes (19): Props, RepairQuotaChip(), useRepairAnalysis(), UseRepairAnalysisOpts, AnalysisStatus, fetchActiveAnalysesBulk(), fetchActiveAnalysis(), fetchQuotaState() (+11 more)

### Community 18 - "InvestorPortalLayout.tsx"
Cohesion: 0.15
Nodes (17): 1) Portal auth is inconsistent and effectively bypassed in multiple portal layouts, 2) Deals persistence skips saving empty arrays, 3) Edge function logs raw listing payloads and partial JSON, Highest-risk breakpoints, navItems, PartnerPortalLayout(), AccessTierBanner(), Props (+9 more)

### Community 19 - "devDependencies"
Cohesion: 0.09
Nodes (22): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom (+14 more)

### Community 20 - "Section8Calculator.tsx"
Cohesion: 0.17
Nodes (15): CompReportStatus(), formatCurrency(), STATUS_CLASS, STATUS_LABEL, timeAgo(), formatCurrency(), InfoTooltip(), initialInputs (+7 more)

### Community 21 - "20260309130000_admin_user_control_center.sql"
Cohesion: 0.15
Nodes (12): admin_audit_log_actor_idx, admin_audit_log_created_at_idx, admin_audit_log_target_idx, on_auth_user_created_profile, portal_access_requests_set_updated_at, portal_access_requests_status_idx, portal_access_requests_user_id_idx, profiles_set_updated_at (+4 more)

### Community 22 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+12 more)

### Community 23 - "Reliability / Fragility / Consistency Audit"
Cohesion: 0.10
Nodes (19): 10) Missing evidence for RLS/auth coupling and deploy-time env validation, 11) Duplicate toast hook paths may confuse imports, 4) Login pages imply auth, but portal access logic is not truly connected, 5) Dual lockfiles (`package-lock.json`, `bun.lock`, `bun.lockb`), 6) `any` usage in API error handling and listing normalization, 7) No cancellation/race handling in MLS search hook, 8) ArcGIS enrichment timeout is fixed and global assumptions are hardcoded, 9) Path naming/portal behavior differs by audience with no shared guard abstraction (+11 more)

### Community 24 - "CompArvPanel.tsx"
Cohesion: 0.14
Nodes (13): @radix-ui/react-collapsible, CompArvPanel(), CompRow(), fmt(), Props, tierColor, buildCompEvidence(), caveats() (+5 more)

### Community 25 - "DealAlertSettings.tsx"
Cohesion: 0.24
Nodes (16): @radix-ui/react-switch, DealAlertSettings(), SOURCES, STRATEGIES, Switch, disablePushOnThisDevice(), enablePushOnThisDevice(), encodeKey() (+8 more)

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

### Community 31 - "PortalPartnerProfile.tsx"
Cohesion: 0.24
Nodes (11): @radix-ui/react-separator, Separator, getContractors(), getPartnerById(), getPartnersByType(), NetworkPartner, networkPartners, PartnerType (+3 more)

### Community 32 - "Daily Property Harvest – Implementation Plan"
Cohesion: 0.14
Nodes (13): 1. Database Table: `deals`, 2. Edge Function: `daily-mls-harvest`, 3. Cron Schedule, 4. Frontend: `/deals` Page, 5. Admin Trigger, Behavior, Columns, Daily Property Harvest – Implementation Plan (+5 more)

### Community 33 - "form.tsx"
Cohesion: 0.19
Nodes (12): @radix-ui/react-label, react-hook-form, FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext (+4 more)

### Community 34 - "toast.tsx"
Cohesion: 0.29
Nodes (10): @radix-ui/react-toast, Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastTitle, toastVariants (+2 more)

### Community 35 - "fetch-mls-listings/index.ts"
Cohesion: 0.23
Nodes (10): buildRepliersUrl(), corsHeaders, fetchSingleZip(), lookupCountySqft(), mapStatus(), normalizeAddress(), normalizeListing(), STL_COUNTY_ZIPS (+2 more)

### Community 36 - "Repliers MLS API Reference"
Cohesion: 0.17
Nodes (11): Authentication, Base URL, Docs Links, Endpoints, Get Single Listing: `GET /listings/{mlsNumber}`, Memory: integrations/repliers-mls-api, Our Edge Function Mapping, Repliers MLS API Reference (+3 more)

### Community 37 - "chart.tsx"
Cohesion: 0.24
Nodes (11): recharts, ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartStyle(), ChartTooltipContent (+3 more)

### Community 38 - "Index.tsx"
Cohesion: 0.29
Nodes (7): AboutSection(), AudienceCard(), AudienceCardProps, audiences, AudienceSection(), HeroSection(), Index()

### Community 39 - "20260610193325_b5c38f28-c644-4c8a-aaef-5bb77537f83a.sql"
Cohesion: 0.23
Nodes (7): analyzer_usage_user_ran_at_idx, consent_log_user_idx, public.analyzer_usage, public.consent_log, public.get_access_tier(), public.set_baa_status_on_investor_role(), trg_set_baa_status_on_investor

### Community 40 - "sheet.tsx"
Cohesion: 0.22
Nodes (10): @radix-ui/react-dialog, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+2 more)

### Community 41 - "types.ts"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 42 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowJs, noImplicitAny, noUnusedLocals, noUnusedParameters, paths, skipLibCheck, strictNullChecks (+2 more)

### Community 43 - "20260518204925_11b6b949-19f4-4e3f-9779-98095acb9075.sql"
Cohesion: 0.31
Nodes (7): comp_reports_active_uniq, comp_reports_mls_idx, comp_reports_property_refreshed_idx, comp_reports_status_idx, public.comp_reports, update_comp_report_overrides_updated_at, update_comp_reports_updated_at

### Community 44 - "class-variance-authority"
Cohesion: 0.29
Nodes (8): class-variance-authority, @radix-ui/react-toggle, @radix-ui/react-toggle-group, ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 45 - "pagination.tsx"
Cohesion: 0.24
Nodes (9): ButtonProps, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem, PaginationLink(), PaginationLinkProps, PaginationNext() (+1 more)

### Community 46 - "process-repair-queue/index.ts"
Cohesion: 0.24
Nodes (7): clamp01(), corsHeaders, emptyLineItems(), Observations, OBSERVATIONS_SCHEMA, priceRepairs(), PricingRules

### Community 47 - "navigation-menu.tsx"
Cohesion: 0.28
Nodes (8): @radix-ui/react-navigation-menu, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 48 - "breadcrumb.tsx"
Cohesion: 0.22
Nodes (8): @radix-ui/react-slot, Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 49 - "drawer.tsx"
Cohesion: 0.25
Nodes (7): vaul, DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 50 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:dev, dev, lint, preview, test, test:watch

### Community 51 - "20260518212230_77cfae76-ddf9-4e2b-88fa-1d9b251d7daf.sql"
Cohesion: 0.32
Nodes (5): ai_analysis_quota_updated_at, public.repair_pricing_rules, repair_analyses_updated_at, repair_pricing_rules_active_uniq, repair_pricing_rules_version_uniq

### Community 52 - "vitest"
Cohesion: 0.29
Nodes (4): lovable-tagger, vite, @vitejs/plugin-react-swc, vitest

### Community 53 - "dotloop-send-baa/index.ts"
Cohesion: 0.25
Nodes (5): corsHeaders, DOTLOOP_BAA_TEMPLATE_ID, DOTLOOP_PROFILE_ID, DOTLOOP_TOKEN, DotloopSendResult

### Community 54 - "Welcome to your Lovable project"
Cohesion: 0.29
Nodes (6): Can I connect a custom domain to my Lovable project?, How can I deploy this project?, How can I edit this code?, Project info, Welcome to your Lovable project, What technologies are used for this project?

### Community 56 - "analyze-repairs/index.ts"
Cohesion: 0.38
Nodes (5): computeEvidenceHash(), corsHeaders, ListingSnapshot, normalizeRemarks(), sha1()

### Community 57 - "20260313202934_3a069b5a-7922-4625-a790-d33f07d4f0a3.sql"
Cohesion: 0.43
Nodes (4): on_auth_user_created, public.handle_new_user(), public.portal_access_requests, public.profiles

### Community 58 - "eslint.config.js"
Cohesion: 0.33
Nodes (5): @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

### Community 59 - "20260904233540_7a273280-f5c3-439a-ac44-3b4b4fab29b9.sql"
Cohesion: 0.53
Nodes (4): public.alert_preferences, public.deal_alerts_sent, public.push_subscriptions, update_alert_preferences_updated_at

### Community 60 - "sonner.tsx"
Cohesion: 0.40
Nodes (4): next-themes, sonner, Toaster(), ToasterProps

### Community 62 - "20260518231855_ecf4842a-193b-4756-8bac-85b8268a90b1.sql"
Cohesion: 0.70
Nodes (4): idx_saved_deals_property_key, idx_saved_deals_user, public.saved_deals, trg_saved_deals_updated_at

## Knowledge Gaps
- **14 isolated node(s):** `@fontsource/inter`, `@fontsource/playfair-display`, `@hookform/resolvers`, `date-fns`, `tailwindcss-animate` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 453 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `Button`, `Card`, `DealPhotoViewer.tsx`, `DealUnderwritingPanel.tsx`, `Badge`, `sidebar.tsx`, `DealAnalyzer.tsx`, `utils.ts`, `BatchAnalysisTable.tsx`, `useDeals`, `InvestorPortalLayout.tsx`, `Section8Calculator.tsx`, `DealAlertSettings.tsx`, `carousel.tsx`, `PortalPartnerProfile.tsx`, `form.tsx`, `toast.tsx`, `chart.tsx`, `sheet.tsx`, `class-variance-authority`, `pagination.tsx`, `navigation-menu.tsx`, `breadcrumb.tsx`, `drawer.tsx`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **What connects `@fontsource/inter`, `@fontsource/playfair-display`, `@hookform/resolvers` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.06765041345879669 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `Button`, `Card`, `cn`, `DealPhotoViewer.tsx`, `PortalSearchAnalyzer.tsx`, `DealUnderwritingPanel.tsx`, `Badge`, `sidebar.tsx`, `package.json`, `DealAnalyzer.tsx`, `utils.ts`, `BatchAnalysisTable.tsx`, `useDeals`, `repairAnalysis.ts`, `InvestorPortalLayout.tsx`, `Section8Calculator.tsx`, `CompArvPanel.tsx`, `DealAlertSettings.tsx`, `carousel.tsx`, `PortalPartnerProfile.tsx`, `toast.tsx`, `Index.tsx`, `sheet.tsx`, `pagination.tsx`, `navigation-menu.tsx`, `breadcrumb.tsx`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.05809979494190021 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `Card`, `cn`, `DealPhotoViewer.tsx`, `PortalSearchAnalyzer.tsx`, `DealUnderwritingPanel.tsx`, `Badge`, `sidebar.tsx`, `package.json`, `DealAnalyzer.tsx`, `compReports.ts`, `utils.ts`, `BatchAnalysisTable.tsx`, `useDeals`, `repairAnalysis.ts`, `InvestorPortalLayout.tsx`, `Section8Calculator.tsx`, `CompArvPanel.tsx`, `DealAlertSettings.tsx`, `carousel.tsx`, `PortalPartnerProfile.tsx`, `form.tsx`, `toast.tsx`, `chart.tsx`, `sheet.tsx`, `class-variance-authority`, `pagination.tsx`, `navigation-menu.tsx`, `breadcrumb.tsx`, `drawer.tsx`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Should `Card` be split into smaller, more focused modules?**
  _Cohesion score 0.13008989952406133 - nodes in this community are weakly interconnected._