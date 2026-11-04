# Graph Report - integrity-repo  (2026-11-04)

## Corpus Check
- 302 files · ~145,332 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .css 2, (none) 1, .lock 1)

## Summary
- 1585 nodes · 5041 edges · 89 communities (63 shown, 26 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6a33fb77`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- lucide-react
- Card
- dependencies
- cn
- DealPhotoViewer.tsx
- PortalSearchAnalyzer.tsx
- DealUnderwritingPanel.tsx
- vitest
- sidebar.tsx
- package.json
- DealAnalyzer.tsx
- lib/compArv.ts
- utils.ts
- documents.ts
- repliersSold.test.ts
- sold-export.ts
- repairAnalysis.ts
- DealAlertSettings.tsx
- devDependencies
- repliers-sold.ts
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
- 20260610193325_b5c38f28-c644-4c8a-aaef-5bb77537f83a.sql
- sheet.tsx
- types.ts
- compilerOptions
- 20260518204925_11b6b949-19f4-4e3f-9779-98095acb9075.sql
- class-variance-authority
- pagination.tsx
- repair-queue.ts
- navigation-menu.tsx
- PortalLocalNetwork.tsx
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
- input-otp.tsx
- 20260309120000_harden_user_roles_auth.sql
- 20260518231855_ecf4842a-193b-4756-8bac-85b8268a90b1.sql
- public.user_roles
- on_auth_user_created_assign_first_user_roles
- public.user_roles
- CompArvPanel.tsx
- public.admin_list_users
- createDocumentsService
- public.get_cron_wake_token
- roadmap.md
- scroll-area.tsx
- admin-invite-user/index.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 260 edges
2. `Button` - 165 edges
3. `lucide-react` - 136 edges
4. `react` - 125 edges
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
- `Test gaps` --references--> `useDeals()`  [INFERRED]
  AUDIT_REPORT.md → src/hooks/useDeals.tsx

## Import Cycles
- None detected.

## Communities (89 total, 26 thin omitted)

### Community 0 - "Button"
Cohesion: 0.07
Nodes (110): react, react-router-dom, App(), queryClient, AdminPortalLayout(), navItems, BuyerIntakeForm(), Footer() (+102 more)

### Community 1 - "lucide-react"
Cohesion: 0.06
Nodes (39): lucide-react, BuyerDisclaimers(), BuyerHero(), BuyerProcess(), BuyerRepresentationDisclosure(), BuyerSearchCTA(), BuyerTestimonials(), BuyerValueProposition() (+31 more)

### Community 2 - "Card"
Cohesion: 0.05
Nodes (107): @tanstack/react-query, DealPotTable(), APPLIANCE_KEYS, FIELDS, NumericKey, RepairPricingEditor(), DetailRow(), ListingDetailBase() (+99 more)

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (54): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, fflate, @fontsource/inter (+46 more)

### Community 4 - "cn"
Cohesion: 0.07
Nodes (42): @radix-ui/react-accordion, @radix-ui/react-avatar, @radix-ui/react-context-menu, @radix-ui/react-dropdown-menu, AccordionContent, AccordionItem, AccordionTrigger, Avatar (+34 more)

### Community 5 - "DealPhotoViewer.tsx"
Cohesion: 0.08
Nodes (35): cmdk, @radix-ui/react-dialog, @radix-ui/react-popover, DealPhotoViewer(), DealPhotoViewerProps, DealPotTableProps, GatedAction(), Props (+27 more)

### Community 6 - "PortalSearchAnalyzer.tsx"
Cohesion: 0.06
Nodes (41): Access tier model, Backend enforcement, Dotloop integration (not yet wired), Frontend enforcement, Onboarding wizard, Profile fields added, Required at signup (`src/pages/Signup.tsx`), BAA requirement (Investor + Buyer only) (+33 more)

### Community 7 - "DealUnderwritingPanel.tsx"
Cohesion: 0.06
Nodes (62): next-themes, @radix-ui/react-tabs, sonner, SendDealAlertPanel(), CheckMlsUpdatesButton(), Chip(), LiveSnapshot, Props (+54 more)

### Community 8 - "vitest"
Cohesion: 0.10
Nodes (10): @supabase/supabase-js, @testing-library/react, vitest, h, pendingRequest, { from, loadSchedules, update, eq, selectUpdate, saveSchedule }, schedule, { invoke, buildSoldExport } (+2 more)

### Community 9 - "sidebar.tsx"
Cohesion: 0.07
Nodes (29): @radix-ui/react-separator, Separator, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent (+21 more)

### Community 10 - "package.json"
Cohesion: 0.05
Nodes (36): name, private, type, version, autoprefixer, date-fns, eslint, @eslint/js (+28 more)

### Community 11 - "DealAnalyzer.tsx"
Cohesion: 0.16
Nodes (20): @radix-ui/react-tooltip, CompReportStatus(), formatCurrency(), STATUS_CLASS, STATUS_LABEL, timeAgo(), DealAnalyzer(), DealInputs (+12 more)

### Community 12 - "lib/compArv.ts"
Cohesion: 0.14
Nodes (25): useCompArv(), ADJ, assignTier(), buildCompArv(), computeAdjustments(), detectSoftFlags(), Eligibility, evaluateEligibility() (+17 more)

### Community 13 - "utils.ts"
Cohesion: 0.07
Nodes (19): clsx, @radix-ui/react-hover-card, @radix-ui/react-progress, @radix-ui/react-radio-group, @radix-ui/react-slider, react-day-picker, react-resizable-panels, tailwind-merge (+11 more)

### Community 14 - "documents.ts"
Cohesion: 0.15
Nodes (15): blobBytes(), CatalogDocument, DOCUMENT_KIND_LABELS, DOCUMENT_KINDS, DocumentKind, DocumentsClient, documentsService, EXPECTED_STANDING_KINDS (+7 more)

### Community 15 - "repliersSold.test.ts"
Cohesion: 0.20
Nodes (9): emptyResponse(), request, response(), CallerClient, createFetchSoldListingsHandler(), getUser(), soldReportCorsHeaders, SoldReportRequest (+1 more)

### Community 16 - "sold-export.ts"
Cohesion: 0.23
Nodes (12): fflate, exportFile(), row, buildSoldExport(), csvCell(), SOLD_EXPORT_COLUMNS, SoldExportFormat, values() (+4 more)

### Community 17 - "repairAnalysis.ts"
Cohesion: 0.20
Nodes (12): Props, RepairQuotaChip(), useRepairAnalysis(), UseRepairAnalysisOpts, AnalysisStatus, fetchActiveAnalysesBulk(), fetchActiveAnalysis(), fetchQuotaState() (+4 more)

### Community 18 - "DealAlertSettings.tsx"
Cohesion: 0.26
Nodes (15): DealAlertSettings(), SOURCES, STRATEGIES, Switch, disablePushOnThisDevice(), enablePushOnThisDevice(), encodeKey(), getRegistration() (+7 more)

### Community 19 - "devDependencies"
Cohesion: 0.06
Nodes (30): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom (+22 more)

### Community 20 - "repliers-sold.ts"
Cohesion: 0.38
Nodes (10): extractSoldDate(), fetchSoldListings(), isObject(), JsonObject, normalizeSoldListing(), soldCalendarDate(), stringValue(), isSoldReportDate() (+2 more)

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

### Community 25 - "compReports.ts"
Cohesion: 0.17
Nodes (24): Props, useCompReport(), UseCompReportArgs, UseCompReportReturn, buildSummary(), closeReport(), CompReportRow, computeSnapshotStatus() (+16 more)

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

### Community 31 - "client.ts"
Cohesion: 0.27
Nodes (7): useHasRole(), UseHasRoleResult, useUserRoles(), UseUserRolesResult, supabase, allPortals, PortalSelector()

### Community 32 - "Daily Property Harvest – Implementation Plan"
Cohesion: 0.14
Nodes (13): 1. Database Table: `deals`, 2. Edge Function: `daily-mls-harvest`, 3. Cron Schedule, 4. Frontend: `/deals` Page, 5. Admin Trigger, Behavior, Columns, Daily Property Harvest – Implementation Plan (+5 more)

### Community 33 - "form.tsx"
Cohesion: 0.10
Nodes (20): @radix-ui/react-label, @radix-ui/react-slot, react-hook-form, Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList (+12 more)

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
Cohesion: 0.24
Nodes (9): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants (+1 more)

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

### Community 46 - "repair-queue.ts"
Cohesion: 0.07
Nodes (33): NOW, computeEvidenceHash(), corsHeaders, ListingSnapshot, normalizeRemarks(), sha1(), callVision(), clamp01() (+25 more)

### Community 47 - "navigation-menu.tsx"
Cohesion: 0.28
Nodes (8): @radix-ui/react-navigation-menu, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 48 - "PortalLocalNetwork.tsx"
Cohesion: 0.43
Nodes (6): getContractors(), getPartnersByType(), NetworkPartner, networkPartners, PartnerType, PortalLocalNetwork()

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
Cohesion: 0.16
Nodes (15): row, schedule, corsHeaders, EmailSchedule, getNewSoldRows(), getScheduleCadenceBucket(), getSoldSchedulePlan(), processEmailSchedule() (+7 more)

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

### Community 60 - "input-otp.tsx"
Cohesion: 0.33
Nodes (5): input-otp, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 62 - "20260518231855_ecf4842a-193b-4756-8bac-85b8268a90b1.sql"
Cohesion: 0.70
Nodes (4): idx_saved_deals_property_key, idx_saved_deals_user, public.saved_deals, trg_saved_deals_updated_at

### Community 66 - "CompArvPanel.tsx"
Cohesion: 0.16
Nodes (13): CompArvPanel(), CompRow(), fmt(), Props, tierColor, buildCompEvidence(), caveats(), CompEvidenceRow (+5 more)

### Community 68 - "createDocumentsService"
Cohesion: 0.67
Nodes (4): createDocumentsService(), appendEvent(), findByFingerprint(), from()

### Community 87 - "scroll-area.tsx"
Cohesion: 0.67
Nodes (3): @radix-ui/react-scroll-area, ScrollArea, ScrollBar

## Knowledge Gaps
- **14 isolated node(s):** `@fontsource/inter`, `@fontsource/playfair-display`, `@hookform/resolvers`, `date-fns`, `tailwindcss-animate` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 518 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `Button`, `Card`, `DealPhotoViewer.tsx`, `PortalSearchAnalyzer.tsx`, `DealUnderwritingPanel.tsx`, `sidebar.tsx`, `DealAnalyzer.tsx`, `utils.ts`, `DealAlertSettings.tsx`, `carousel.tsx`, `form.tsx`, `toast.tsx`, `chart.tsx`, `sheet.tsx`, `class-variance-authority`, `pagination.tsx`, `navigation-menu.tsx`, `drawer.tsx`, `input-otp.tsx`, `scroll-area.tsx`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **What connects `@fontsource/inter`, `@fontsource/playfair-display`, `@hookform/resolvers` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.06914344685242518 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `Button`, `Card`, `cn`, `DealPhotoViewer.tsx`, `PortalSearchAnalyzer.tsx`, `DealUnderwritingPanel.tsx`, `sidebar.tsx`, `package.json`, `DealAnalyzer.tsx`, `utils.ts`, `documents.ts`, `repairAnalysis.ts`, `DealAlertSettings.tsx`, `carousel.tsx`, `client.ts`, `form.tsx`, `toast.tsx`, `sheet.tsx`, `pagination.tsx`, `navigation-menu.tsx`, `PortalLocalNetwork.tsx`, `Index.tsx`, `input-otp.tsx`, `CompArvPanel.tsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.05809979494190021 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `Card`, `cn`, `DealPhotoViewer.tsx`, `PortalSearchAnalyzer.tsx`, `DealUnderwritingPanel.tsx`, `sidebar.tsx`, `package.json`, `DealAnalyzer.tsx`, `lib/compArv.ts`, `utils.ts`, `documents.ts`, `repairAnalysis.ts`, `DealAlertSettings.tsx`, `compReports.ts`, `carousel.tsx`, `client.ts`, `form.tsx`, `toast.tsx`, `chart.tsx`, `sheet.tsx`, `class-variance-authority`, `pagination.tsx`, `navigation-menu.tsx`, `drawer.tsx`, `input-otp.tsx`, `CompArvPanel.tsx`, `scroll-area.tsx`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Should `Card` be split into smaller, more focused modules?**
  _Cohesion score 0.05287502267368039 - nodes in this community are weakly interconnected._