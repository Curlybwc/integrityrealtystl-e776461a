# Graph Report - integrity-repo  (2026-11-05)

## Corpus Check
- 305 files · ~146,734 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .css 2, (none) 1, .lock 1)

## Summary
- 1598 nodes · 5078 edges · 95 communities (64 shown, 31 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ad2c72f3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- lucide-react
- App.tsx
- dependencies
- cn
- zip-combobox.tsx
- useAccessTier
- Badge
- Section8Calculator.tsx
- sidebar.tsx
- package.json
- DealAnalyzer.tsx
- lib/compArv.ts
- utils.ts
- documents.ts
- Onboarding Requirements & Tiered Access
- stlZipData.ts
- repairAnalysis.ts
- DealAlertSettings.tsx
- devDependencies
- dialog.tsx
- 20260309130000_admin_user_control_center.sql
- compilerOptions
- Reliability / Fragility / Consistency Audit
- 20261019090000_client_email_schedules.sql
- PortalSearchAnalyzer.tsx
- fetch-comp-arv/index.ts
- components.json
- ref_https
- compilerOptions
- carousel.tsx
- PortalSelector.tsx
- Daily Property Harvest – Implementation Plan
- form.tsx
- toast.tsx
- fetch-mls-listings/index.ts
- Repliers MLS API Reference
- chart.tsx
- AGENTS.md
- 20260610193325_b5c38f28-c644-4c8a-aaef-5bb77537f83a.sql
- sheet.tsx
- types.ts
- compilerOptions
- 20260518204925_11b6b949-19f4-4e3f-9779-98095acb9075.sql
- scripts
- pagination.tsx
- repair-queue.ts
- navigation-menu.tsx
- Access tier model
- drawer.tsx
- 20261103210000_0706_document_catalog.sql
- 20260518212230_77cfae76-ddf9-4e2b-88fa-1d9b251d7daf.sql
- email-schedules.ts
- dotloop-send-baa/index.ts
- Welcome to your Lovable project
- send-deal-alert/index.ts
- Index.tsx
- 20260313202934_3a069b5a-7922-4625-a790-d33f07d4f0a3.sql
- previewAuthStorage.ts
- 20260904233540_7a273280-f5c3-439a-ac44-3b4b4fab29b9.sql
- vite.config.ts
- 20260309120000_harden_user_roles_auth.sql
- 20260518231855_ecf4842a-193b-4756-8bac-85b8268a90b1.sql
- public.user_roles
- on_auth_user_created_assign_first_user_roles
- public.user_roles
- sonner.tsx
- public.admin_list_users
- radio-group.tsx
- public.get_cron_wake_token
- roadmap.md
- calendar.tsx
- resizable.tsx
- main.tsx
- admin-invite-user/index.ts
- aspect-ratio.tsx
- collapsible.tsx
- tailwindcss
- @testing-library/jest-dom

## God Nodes (most connected - your core abstractions)
1. `cn()` - 260 edges
2. `Button` - 167 edges
3. `lucide-react` - 137 edges
4. `react` - 126 edges
5. `Input` - 89 edges
6. `Label` - 85 edges
7. `App()` - 71 edges
8. `useToast()` - 71 edges
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

## Communities (95 total, 31 thin omitted)

### Community 0 - "Button"
Cohesion: 0.10
Nodes (64): react, react-router-dom, BuyerIntakeForm(), Footer(), Header(), navLinks, InvestorIntakeForm(), Layout() (+56 more)

### Community 1 - "lucide-react"
Cohesion: 0.06
Nodes (39): lucide-react, BuyerDisclaimers(), BuyerHero(), BuyerProcess(), BuyerRepresentationDisclosure(), BuyerSearchCTA(), BuyerTestimonials(), BuyerValueProposition() (+31 more)

### Community 2 - "App.tsx"
Cohesion: 0.05
Nodes (112): @supabase/supabase-js, @tanstack/react-query, @testing-library/react, vitest, App(), queryClient, APPLIANCE_KEYS, FIELDS (+104 more)

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (54): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, fflate, @fontsource/inter (+46 more)

### Community 4 - "cn"
Cohesion: 0.05
Nodes (57): input-otp, @radix-ui/react-accordion, @radix-ui/react-avatar, @radix-ui/react-context-menu, @radix-ui/react-dropdown-menu, @radix-ui/react-menubar, @radix-ui/react-slot, AccordionContent (+49 more)

### Community 5 - "zip-combobox.tsx"
Cohesion: 0.11
Nodes (21): cmdk, @radix-ui/react-popover, GatedAction(), Props, tierRank, Command, CommandDialog(), CommandDialogProps (+13 more)

### Community 6 - "useAccessTier"
Cohesion: 0.25
Nodes (12): Frontend enforcement, Build order, PreviewQuotaChip(), PreviewQuotaGate(), Props, AccessTier, AccessTierProfile, useAccessTier() (+4 more)

### Community 7 - "Badge"
Cohesion: 0.05
Nodes (99): DealPhotoViewer(), DealPhotoViewerProps, DealPotTable(), DealPotTableProps, SendDealAlertPanel(), CheckMlsUpdatesButton(), Chip(), LiveSnapshot (+91 more)

### Community 8 - "Section8Calculator.tsx"
Cohesion: 0.17
Nodes (13): @radix-ui/react-tooltip, CompReportStatus(), formatCurrency(), STATUS_CLASS, STATUS_LABEL, timeAgo(), formatCurrency(), InfoTooltip() (+5 more)

### Community 9 - "sidebar.tsx"
Cohesion: 0.08
Nodes (27): SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader (+19 more)

### Community 10 - "package.json"
Cohesion: 0.06
Nodes (33): name, private, type, version, autoprefixer, clsx, date-fns, eslint (+25 more)

### Community 11 - "DealAnalyzer.tsx"
Cohesion: 0.31
Nodes (10): DealAnalyzer(), DealInputs, formatCurrency(), formatPercent(), InfoTooltip(), initialInputs, ResultRow(), getRentComp() (+2 more)

### Community 12 - "lib/compArv.ts"
Cohesion: 0.06
Nodes (62): CompArvPanel(), CompRow(), fmt(), Props, tierColor, Props, useCompArv(), useCompReport() (+54 more)

### Community 13 - "utils.ts"
Cohesion: 0.10
Nodes (23): @radix-ui/react-hover-card, @radix-ui/react-scroll-area, @radix-ui/react-slider, AdminPortalLayout(), navItems, NavLink, NavLinkCompatProps, PartnerPortalLayout() (+15 more)

### Community 14 - "documents.ts"
Cohesion: 0.07
Nodes (30): blobBytes(), CatalogDocument, createDocumentsService(), appendEvent(), findByFingerprint(), DOCUMENT_KIND_LABELS, DOCUMENT_KINDS, DocumentKind (+22 more)

### Community 15 - "Onboarding Requirements & Tiered Access"
Cohesion: 0.14
Nodes (13): BAA requirement (Investor + Buyer only), Backend changes, Edge functions, New table: `analyzer_usage`, New table: `consent_log`, Onboarding Requirements & Tiered Access, Open items needing your input later (not blocking this build), Profile schema additions (+5 more)

### Community 16 - "stlZipData.ts"
Cohesion: 0.17
Nodes (10): ARV_PER_SF, calculateArvQuick(), FMR_BY_ZIP, getArvPerSf(), getSection8SupportedZips(), RENT_COMPS_BY_ZIP, REPAIR_COSTS_PER_SF, RepairPreset (+2 more)

### Community 17 - "repairAnalysis.ts"
Cohesion: 0.23
Nodes (10): Props, useRepairAnalysis(), UseRepairAnalysisOpts, AnalysisStatus, fetchActiveAnalysis(), isAnalysisComplete(), RepairAnalysisRow, repairStateFromRow() (+2 more)

### Community 18 - "DealAlertSettings.tsx"
Cohesion: 0.30
Nodes (14): DealAlertSettings(), SOURCES, STRATEGIES, disablePushOnThisDevice(), enablePushOnThisDevice(), encodeKey(), getRegistration(), isIos() (+6 more)

### Community 19 - "devDependencies"
Cohesion: 0.09
Nodes (22): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom (+14 more)

### Community 20 - "dialog.tsx"
Cohesion: 0.27
Nodes (8): ListingPhotoModal(), ListingPhotoModalProps, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle

### Community 21 - "20260309130000_admin_user_control_center.sql"
Cohesion: 0.15
Nodes (12): admin_audit_log_actor_idx, admin_audit_log_created_at_idx, admin_audit_log_target_idx, on_auth_user_created_profile, portal_access_requests_set_updated_at, portal_access_requests_status_idx, portal_access_requests_user_id_idx, profiles_set_updated_at (+4 more)

### Community 22 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+12 more)

### Community 23 - "Reliability / Fragility / Consistency Audit"
Cohesion: 0.08
Nodes (23): 10) Missing evidence for RLS/auth coupling and deploy-time env validation, 11) Duplicate toast hook paths may confuse imports, 1) Portal auth is inconsistent and effectively bypassed in multiple portal layouts, 2) Deals persistence skips saving empty arrays, 3) Edge function logs raw listing payloads and partial JSON, 4) Login pages imply auth, but portal access logic is not truly connected, 5) Dual lockfiles (`package-lock.json`, `bun.lock`, `bun.lockb`), 6) `any` usage in API error handling and listing normalization (+15 more)

### Community 24 - "20261019090000_client_email_schedules.sql"
Cohesion: 0.60
Nodes (5): client_email_schedule_sends_cadence_bucket_key, client_email_schedule_sends_schedule_time_idx, client_email_schedule_sends_successful_window_idx, public.client_email_schedule_sends, public.client_email_schedules

### Community 25 - "PortalSearchAnalyzer.tsx"
Cohesion: 0.33
Nodes (8): RepairQuotaChip(), Alert, AlertDescription, AlertTitle, alertVariants, fetchQuotaState(), QuotaState, PortalSearchAnalyzer()

### Community 26 - "fetch-comp-arv/index.ts"
Cohesion: 0.16
Nodes (17): ADJ, adjust(), assignTier(), CompTier, corsHeaders, EligibilityStage, evalElig(), FinishTier (+9 more)

### Community 27 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 28 - "ref_https"
Cohesion: 0.14
Nodes (7): corsHeaders, corsHeaders, ALLOWED, corsHeaders, corsHeaders, corsHeaders, Entry

### Community 29 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+7 more)

### Community 30 - "carousel.tsx"
Cohesion: 0.17
Nodes (14): embla-carousel-react, Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext (+6 more)

### Community 31 - "PortalSelector.tsx"
Cohesion: 0.33
Nodes (6): useHasRole(), UseHasRoleResult, useUserRoles(), UseUserRolesResult, allPortals, PortalSelector()

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

### Community 39 - "20260610193325_b5c38f28-c644-4c8a-aaef-5bb77537f83a.sql"
Cohesion: 0.23
Nodes (7): analyzer_usage_user_ran_at_idx, consent_log_user_idx, public.analyzer_usage, public.consent_log, public.get_access_tier(), public.set_baa_status_on_investor_role(), trg_set_baa_status_on_investor

### Community 40 - "sheet.tsx"
Cohesion: 0.22
Nodes (10): @radix-ui/react-dialog, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+2 more)

### Community 41 - "types.ts"
Cohesion: 0.20
Nodes (9): CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables, TablesInsert (+1 more)

### Community 42 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowJs, noImplicitAny, noUnusedLocals, noUnusedParameters, paths, skipLibCheck, strictNullChecks (+2 more)

### Community 43 - "20260518204925_11b6b949-19f4-4e3f-9779-98095acb9075.sql"
Cohesion: 0.31
Nodes (7): comp_reports_active_uniq, comp_reports_mls_idx, comp_reports_property_refreshed_idx, comp_reports_status_idx, public.comp_reports, update_comp_report_overrides_updated_at, update_comp_reports_updated_at

### Community 44 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:dev, dev, lint, preview, test, test:watch

### Community 45 - "pagination.tsx"
Cohesion: 0.24
Nodes (9): ButtonProps, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem, PaginationLink(), PaginationLinkProps, PaginationNext() (+1 more)

### Community 46 - "repair-queue.ts"
Cohesion: 0.07
Nodes (33): NOW, computeEvidenceHash(), corsHeaders, ListingSnapshot, normalizeRemarks(), sha1(), callVision(), clamp01() (+25 more)

### Community 47 - "navigation-menu.tsx"
Cohesion: 0.15
Nodes (14): class-variance-authority, @radix-ui/react-navigation-menu, @radix-ui/react-toggle, @radix-ui/react-toggle-group, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList (+6 more)

### Community 48 - "Access tier model"
Cohesion: 0.29
Nodes (6): Access tier model, Backend enforcement, Dotloop integration (not yet wired), Onboarding wizard, Profile fields added, Required at signup (`src/pages/Signup.tsx`)

### Community 49 - "drawer.tsx"
Cohesion: 0.25
Nodes (7): vaul, DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 50 - "20261103210000_0706_document_catalog.sql"
Cohesion: 0.39
Nodes (5): document_events_document_idx, documents_owner_created_idx, documents_owner_fingerprint_key, public.document_events, public.documents

### Community 51 - "20260518212230_77cfae76-ddf9-4e2b-88fa-1d9b251d7daf.sql"
Cohesion: 0.32
Nodes (5): ai_analysis_quota_updated_at, public.repair_pricing_rules, repair_analyses_updated_at, repair_pricing_rules_active_uniq, repair_pricing_rules_version_uniq

### Community 52 - "email-schedules.ts"
Cohesion: 0.07
Nodes (46): fflate, row, schedule, emptyResponse(), request, response(), exportFile(), row (+38 more)

### Community 53 - "dotloop-send-baa/index.ts"
Cohesion: 0.25
Nodes (5): corsHeaders, DOTLOOP_BAA_TEMPLATE_ID, DOTLOOP_PROFILE_ID, DOTLOOP_TOKEN, DotloopSendResult

### Community 54 - "Welcome to your Lovable project"
Cohesion: 0.29
Nodes (6): Can I connect a custom domain to my Lovable project?, How can I deploy this project?, How can I edit this code?, Project info, Welcome to your Lovable project, What technologies are used for this project?

### Community 56 - "Index.tsx"
Cohesion: 0.29
Nodes (7): AboutSection(), AudienceCard(), AudienceCardProps, audiences, AudienceSection(), HeroSection(), Index()

### Community 57 - "20260313202934_3a069b5a-7922-4625-a790-d33f07d4f0a3.sql"
Cohesion: 0.43
Nodes (4): on_auth_user_created, public.handle_new_user(), public.portal_access_requests, public.profiles

### Community 58 - "previewAuthStorage.ts"
Cohesion: 0.33
Nodes (6): brokeredPreviewStorage(), BrokerReply, BrokerRequest, BrokerRequestType, PreviewAuthStorage, readBrokerReply()

### Community 59 - "20260904233540_7a273280-f5c3-439a-ac44-3b4b4fab29b9.sql"
Cohesion: 0.53
Nodes (4): public.alert_preferences, public.deal_alerts_sent, public.push_subscriptions, update_alert_preferences_updated_at

### Community 60 - "vite.config.ts"
Cohesion: 0.40
Nodes (3): lovable-tagger, vite, @vitejs/plugin-react-swc

### Community 62 - "20260518231855_ecf4842a-193b-4756-8bac-85b8268a90b1.sql"
Cohesion: 0.70
Nodes (4): idx_saved_deals_property_key, idx_saved_deals_user, public.saved_deals, trg_saved_deals_updated_at

### Community 66 - "sonner.tsx"
Cohesion: 0.40
Nodes (4): next-themes, sonner, Toaster(), ToasterProps

### Community 68 - "radio-group.tsx"
Cohesion: 0.50
Nodes (3): @radix-ui/react-radio-group, RadioGroup, RadioGroupItem

### Community 85 - "calendar.tsx"
Cohesion: 0.50
Nodes (3): react-day-picker, Calendar(), CalendarProps

### Community 86 - "resizable.tsx"
Cohesion: 0.50
Nodes (3): react-resizable-panels, ResizableHandle(), ResizablePanelGroup()

## Knowledge Gaps
- **14 isolated node(s):** `@fontsource/inter`, `@fontsource/playfair-display`, `@hookform/resolvers`, `date-fns`, `tailwindcss-animate` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 521 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `Button`, `App.tsx`, `zip-combobox.tsx`, `Badge`, `Section8Calculator.tsx`, `sidebar.tsx`, `utils.ts`, `dialog.tsx`, `PortalSearchAnalyzer.tsx`, `carousel.tsx`, `form.tsx`, `toast.tsx`, `chart.tsx`, `sheet.tsx`, `pagination.tsx`, `navigation-menu.tsx`, `drawer.tsx`, `radio-group.tsx`, `calendar.tsx`, `resizable.tsx`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **What connects `@fontsource/inter`, `@fontsource/playfair-display`, `@hookform/resolvers` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.10296495956873315 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `App.tsx`, `cn`, `zip-combobox.tsx`, `useAccessTier`, `Badge`, `Section8Calculator.tsx`, `sidebar.tsx`, `package.json`, `DealAnalyzer.tsx`, `lib/compArv.ts`, `utils.ts`, `documents.ts`, `repairAnalysis.ts`, `DealAlertSettings.tsx`, `dialog.tsx`, `PortalSearchAnalyzer.tsx`, `carousel.tsx`, `PortalSelector.tsx`, `form.tsx`, `toast.tsx`, `chart.tsx`, `sheet.tsx`, `pagination.tsx`, `navigation-menu.tsx`, `drawer.tsx`, `radio-group.tsx`, `calendar.tsx`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.05809979494190021 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `Button`, `App.tsx`, `cn`, `zip-combobox.tsx`, `useAccessTier`, `Badge`, `Section8Calculator.tsx`, `sidebar.tsx`, `package.json`, `DealAnalyzer.tsx`, `lib/compArv.ts`, `utils.ts`, `documents.ts`, `DealAlertSettings.tsx`, `dialog.tsx`, `PortalSearchAnalyzer.tsx`, `carousel.tsx`, `PortalSelector.tsx`, `toast.tsx`, `sheet.tsx`, `pagination.tsx`, `navigation-menu.tsx`, `Index.tsx`, `radio-group.tsx`, `calendar.tsx`, `resizable.tsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05151358789129687 - nodes in this community are weakly interconnected._