# Graph Report - integrity-git  (2026-11-09)

## Corpus Check
- 318 files · ~147,891 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .css 2, (none) 1, .lock 1)

## Summary
- 1786 nodes · 5566 edges · 116 communities (76 shown, 40 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e64b3a35`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- lucide-react
- AdminUsers.tsx
- dependencies
- cn
- zip-combobox.tsx
- Onboarding Requirements & Tiered Access
- DealUnderwritingPanel.tsx
- vitest
- crmMessages.ts
- devDependencies
- DealAnalyzer.tsx
- lib/compArv.ts
- utils.ts
- documents.ts
- email-schedules.ts
- PortalSearchAnalyzer.tsx
- BatchAnalysisTable.tsx
- DealAlertSettings.tsx
- scripts
- crmContacts.ts
- 20260309130000_admin_user_control_center.sql
- compilerOptions
- InvestorPortalLayout.tsx
- 20261019090000_client_email_schedules.sql
- crmMessages.test.ts
- fetch-comp-arv/index.ts
- components.json
- ref_https
- compilerOptions
- carousel.tsx
- analyze-repairs/index.ts
- Daily Property Harvest – Implementation Plan
- form.tsx
- toast.tsx
- Section8Calculator.tsx
- Repliers MLS API Reference
- chart.tsx
- AGENTS.md
- 20260610193325_b5c38f28-c644-4c8a-aaef-5bb77537f83a.sql
- sheet.tsx
- types.ts
- compilerOptions
- 20260518204925_11b6b949-19f4-4e3f-9779-98095acb9075.sql
- package.json
- pagination.tsx
- repair-queue.ts
- navigation-menu.tsx
- fetch-mls-listings/index.ts
- drawer.tsx
- 20261103210000_0706_document_catalog.sql
- 20260518212230_77cfae76-ddf9-4e2b-88fa-1d9b251d7daf.sql
- process-repair-queue/index.ts
- reviews
- Welcome to your Lovable project
- send-deal-alert/index.ts
- Card
- auth.users
- 20261109130000_0709_crm_messages.sql
- previewAuthStorage.ts
- crmPipelinesCalls.test.ts
- sidebar.tsx
- 20260518231855_ecf4842a-193b-4756-8bac-85b8268a90b1.sql
- PortalPartnerProfile.tsx
- compReports.ts
- dotloop-send-baa/index.ts
- CompArvPanel.tsx
- Access tier model
- public.crm_contacts
- public.get_cron_wake_token
- roadmap.md
- steps
- Landing 2 — prepared DNS record set + info@ setup (NOT applied)
- App.tsx
- InvestorListingPage.tsx
- dialog.tsx
- CompReportStatus.tsx
- @vitejs/plugin-react-swc
- 20261109140000_0709_crm_pipelines_calls.sql
- sonner
- cmdk
- collapsible.tsx
- 20260309120000_harden_user_roles_auth.sql
- aspect-ratio.tsx
- CallBookingForm.tsx
- @radix-ui/react-toggle
- @radix-ui/react-hover-card
- public.user_roles
- @radix-ui/react-toggle-group
- date-fns@^3.6.0
- zod
- input-otp
- @radix-ui/react-alert-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-menubar
- @radix-ui/react-navigation-menu
- @radix-ui/react-popover
- @radix-ui/react-toast
- react-hook-form
- recharts
- tailwindcss-animate@^1.0.7

## God Nodes (most connected - your core abstractions)
1. `cn()` - 260 edges
2. `Button` - 165 edges
3. `lucide-react` - 137 edges
4. `react` - 127 edges
5. `Input` - 87 edges
6. `Label` - 85 edges
7. `useToast()` - 72 edges
8. `App()` - 70 edges
9. `Card` - 70 edges
10. `CardContent` - 70 edges

## Surprising Connections (you probably didn't know these)
- `Recommended fix order` --references--> `useDeals()`  [INFERRED]
  AUDIT_REPORT.md → src/hooks/useDeals.tsx
- `Search/Analyzer 5-run quota` --references--> `DealAnalyzer()`  [INFERRED]
  .lovable/plan.md → src/components/portal/DealAnalyzer.tsx
- `Tiered access model (Investor + Buyer)` --references--> `useAccessTier()`  [INFERRED]
  .lovable/plan.md → src/hooks/useAccessTier.ts
- `Test gaps` --references--> `useMlsSearch()`  [INFERRED]
  AUDIT_REPORT.md → src/hooks/useMlsSearch.tsx
- `Search/Analyzer 5-run quota` --references--> `useMlsSearch()`  [INFERRED]
  .lovable/plan.md → src/hooks/useMlsSearch.tsx

## Import Cycles
- None detected.

## Communities (116 total, 40 thin omitted)

### Community 0 - "Button"
Cohesion: 0.06
Nodes (122): @radix-ui/react-tabs@^1.1.12, @radix-ui/react-tabs, react, react-router-dom, navItems, DealPhotoViewer(), DealPhotoViewerProps, DealPotTable() (+114 more)

### Community 1 - "lucide-react"
Cohesion: 0.05
Nodes (45): lucide-react, BuyerDisclaimers(), BuyerHero(), BuyerProcess(), BuyerRepresentationDisclosure(), BuyerSearchCTA(), BuyerTestimonials(), BuyerValueProposition() (+37 more)

### Community 2 - "AdminUsers.tsx"
Cohesion: 0.18
Nodes (25): @supabase/supabase-js, BatchAnalysisTable(), Table, TableBody, TableCell, TableHead, TableHeader, TableRow (+17 more)

### Community 3 - "dependencies"
Cohesion: 0.06
Nodes (36): dependencies, clsx@^2.1.1, embla-carousel-react@^8.6.0, @fontsource/playfair-display@^5.2.8, lucide-react@^0.462.0, @radix-ui/react-accordion@^1.2.11, @radix-ui/react-avatar@^1.1.10, @radix-ui/react-checkbox@^1.3.2 (+28 more)

### Community 4 - "cn"
Cohesion: 0.06
Nodes (49): AccordionContent, AccordionItem, AccordionTrigger, Avatar, AvatarFallback, AvatarImage, Breadcrumb, BreadcrumbEllipsis() (+41 more)

### Community 5 - "zip-combobox.tsx"
Cohesion: 0.13
Nodes (19): GatedAction(), Props, tierRank, Command, CommandDialog(), CommandDialogProps, CommandEmpty, CommandGroup (+11 more)

### Community 6 - "Onboarding Requirements & Tiered Access"
Cohesion: 0.14
Nodes (13): BAA requirement (Investor + Buyer only), Backend changes, Edge functions, New table: `analyzer_usage`, New table: `consent_log`, Onboarding Requirements & Tiered Access, Open items needing your input later (not blocking this build), Profile schema additions (+5 more)

### Community 7 - "DealUnderwritingPanel.tsx"
Cohesion: 0.09
Nodes (45): DealUnderwritingPanel(), Metric(), moneyInput(), Props, SaveDealButton(), AlertDialogAction, AlertDialogCancel, AlertDialogContent (+37 more)

### Community 8 - "vitest"
Cohesion: 0.10
Nodes (11): @testing-library/react@^16.0.0, vitest@^3.2.4, @testing-library/react, vitest, h, pendingRequest, { from, loadSchedules, update, eq, selectUpdate, saveSchedule }, schedule (+3 more)

### Community 9 - "crmMessages.ts"
Cohesion: 0.11
Nodes (26): CrmContact, CrmGroup, isSuppressed(), selectSendable(), attemptGroupSend(), attemptSend(), audit(), BlockedReason (+18 more)

### Community 10 - "devDependencies"
Cohesion: 0.06
Nodes (33): devDependencies, autoprefixer@^10.4.21, eslint@^9.32.0, @eslint/js@^9.32.0, eslint-plugin-react-hooks@^5.2.0, eslint-plugin-react-refresh@^0.4.20, globals@^15.15.0, jsdom@^20.0.3 (+25 more)

### Community 11 - "DealAnalyzer.tsx"
Cohesion: 0.21
Nodes (15): DealAnalyzer(), DealInputs, formatCurrency(), formatPercent(), InfoTooltip(), initialInputs, ResultRow(), Alert (+7 more)

### Community 12 - "lib/compArv.ts"
Cohesion: 0.14
Nodes (25): useCompArv(), ADJ, assignTier(), buildCompArv(), computeAdjustments(), detectSoftFlags(), Eligibility, evaluateEligibility() (+17 more)

### Community 13 - "utils.ts"
Cohesion: 0.11
Nodes (12): NavLink, NavLinkCompatProps, Calendar(), CalendarProps, HoverCardContent, InputOTP, InputOTPGroup, InputOTPSeparator (+4 more)

### Community 14 - "documents.ts"
Cohesion: 0.11
Nodes (16): blobBytes(), CatalogDocument, createDocumentsService(), DOCUMENT_KIND_LABELS, DOCUMENT_KINDS, DocumentKind, DocumentsClient, documentsService (+8 more)

### Community 15 - "email-schedules.ts"
Cohesion: 0.07
Nodes (43): row, schedule, emptyResponse(), request, response(), exportFile(), row, corsHeaders (+35 more)

### Community 16 - "PortalSearchAnalyzer.tsx"
Cohesion: 0.14
Nodes (24): Frontend enforcement, Build order, PreviewQuotaChip(), PreviewQuotaGate(), Props, AccessTier, AccessTierProfile, useAccessTier() (+16 more)

### Community 17 - "BatchAnalysisTable.tsx"
Cohesion: 0.11
Nodes (25): AnalyzedListing, BatchAnalysisTableProps, SortField, StrategyFilter, strategyOrder, ViewMode, ListingCardProps, Props (+17 more)

### Community 18 - "DealAlertSettings.tsx"
Cohesion: 0.28
Nodes (14): DealAlertSettings(), SOURCES, STRATEGIES, disablePushOnThisDevice(), enablePushOnThisDevice(), encodeKey(), getRegistration(), isIos() (+6 more)

### Community 19 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:dev, dev, lint, preview, test, test:watch

### Community 20 - "crmContacts.ts"
Cohesion: 0.12
Nodes (30): addFactsOnce(), addMethodsOnce(), addSourceOnce(), arrivalMethods(), ContactEvent, ContactFact, ContactMethod, ContactSource (+22 more)

### Community 21 - "20260309130000_admin_user_control_center.sql"
Cohesion: 0.20
Nodes (18): admin_audit_log_actor_idx, admin_audit_log_created_at_idx, admin_audit_log_target_idx, portal_access_requests_set_updated_at, portal_access_requests_status_idx, portal_access_requests_user_id_idx, profiles_set_updated_at, public.admin_audit_log (+10 more)

### Community 22 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+12 more)

### Community 23 - "InvestorPortalLayout.tsx"
Cohesion: 0.05
Nodes (42): 10) Missing evidence for RLS/auth coupling and deploy-time env validation, 11) Duplicate toast hook paths may confuse imports, 1) Portal auth is inconsistent and effectively bypassed in multiple portal layouts, 2) Deals persistence skips saving empty arrays, 3) Edge function logs raw listing payloads and partial JSON, 4) Login pages imply auth, but portal access logic is not truly connected, 5) Dual lockfiles (`package-lock.json`, `bun.lock`, `bun.lockb`), 6) `any` usage in API error handling and listing normalization (+34 more)

### Community 24 - "20261019090000_client_email_schedules.sql"
Cohesion: 0.60
Nodes (5): client_email_schedule_sends_cadence_bucket_key, client_email_schedule_sends_schedule_time_idx, client_email_schedule_sends_successful_window_idx, public.client_email_schedule_sends, public.client_email_schedules

### Community 25 - "crmMessages.test.ts"
Cohesion: 0.12
Nodes (20): addGroup(), createMsgStore(), MessageTransport, recordConsent(), ResendConfig, resendTransport(), TelnyxConfig, telnyxRequest() (+12 more)

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
Cohesion: 0.19
Nodes (13): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+5 more)

### Community 31 - "analyze-repairs/index.ts"
Cohesion: 0.18
Nodes (10): computeEvidenceHash(), corsHeaders, ListingSnapshot, normalizeRemarks(), sha1(), DEDUPE_STATUSES, ExistingAnalysisDependencies, ExistingAnalysisResolution (+2 more)

### Community 32 - "Daily Property Harvest – Implementation Plan"
Cohesion: 0.14
Nodes (13): 1. Database Table: `deals`, 2. Edge Function: `daily-mls-harvest`, 3. Cron Schedule, 4. Frontend: `/deals` Page, 5. Admin Trigger, Behavior, Columns, Daily Property Harvest – Implementation Plan (+5 more)

### Community 33 - "form.tsx"
Cohesion: 0.23
Nodes (10): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+2 more)

### Community 34 - "toast.tsx"
Cohesion: 0.29
Nodes (10): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+2 more)

### Community 35 - "Section8Calculator.tsx"
Cohesion: 0.13
Nodes (18): formatCurrency(), InfoTooltip(), initialInputs, ResultRow(), Section8Calculator(), Section8Inputs, ARV_PER_SF, calculateArvQuick() (+10 more)

### Community 36 - "Repliers MLS API Reference"
Cohesion: 0.17
Nodes (11): Authentication, Base URL, Docs Links, Endpoints, Get Single Listing: `GET /listings/{mlsNumber}`, Memory: integrations/repliers-mls-api, Our Edge Function Mapping, Repliers MLS API Reference (+3 more)

### Community 37 - "chart.tsx"
Cohesion: 0.27
Nodes (10): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartStyle(), ChartTooltipContent, getPayloadConfigFromPayload() (+2 more)

### Community 39 - "20260610193325_b5c38f28-c644-4c8a-aaef-5bb77537f83a.sql"
Cohesion: 0.36
Nodes (6): analyzer_usage_user_ran_at_idx, consent_log_user_idx, public.analyzer_usage, public.consent_log, public.set_baa_status_on_investor_role(), trg_set_baa_status_on_investor

### Community 40 - "sheet.tsx"
Cohesion: 0.22
Nodes (10): @radix-ui/react-dialog@^1.1.14, @radix-ui/react-dialog, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+2 more)

### Community 41 - "types.ts"
Cohesion: 0.20
Nodes (9): CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables, TablesInsert (+1 more)

### Community 42 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowJs, noImplicitAny, noUnusedLocals, noUnusedParameters, paths, skipLibCheck, strictNullChecks (+2 more)

### Community 43 - "20260518204925_11b6b949-19f4-4e3f-9779-98095acb9075.sql"
Cohesion: 0.33
Nodes (8): comp_reports_active_uniq, comp_reports_mls_idx, comp_reports_property_refreshed_idx, comp_reports_status_idx, public.comp_report_overrides, public.comp_reports, update_comp_report_overrides_updated_at, update_comp_reports_updated_at

### Community 44 - "package.json"
Cohesion: 0.08
Nodes (24): fflate@0.8.2, @fontsource/inter@^5.2.8, @hookform/resolvers@^3.10.0, @radix-ui/react-progress@^1.1.7, @radix-ui/react-scroll-area@^1.2.9, @radix-ui/react-separator@^1.1.7, @radix-ui/react-slot@^1.2.3, @radix-ui/react-switch@^1.2.5 (+16 more)

### Community 45 - "pagination.tsx"
Cohesion: 0.24
Nodes (9): ButtonProps, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem, PaginationLink(), PaginationLinkProps, PaginationNext() (+1 more)

### Community 46 - "repair-queue.ts"
Cohesion: 0.18
Nodes (14): NOW, classifyFailure(), errorMessage(), FailureKind, failurePatch(), failureReason(), FailureStage, log() (+6 more)

### Community 47 - "navigation-menu.tsx"
Cohesion: 0.17
Nodes (13): class-variance-authority@^0.7.1, class-variance-authority, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle (+5 more)

### Community 48 - "fetch-mls-listings/index.ts"
Cohesion: 0.23
Nodes (10): buildRepliersUrl(), corsHeaders, fetchSingleZip(), lookupCountySqft(), mapStatus(), normalizeAddress(), normalizeListing(), STL_COUNTY_ZIPS (+2 more)

### Community 49 - "drawer.tsx"
Cohesion: 0.29
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 50 - "20261103210000_0706_document_catalog.sql"
Cohesion: 0.29
Nodes (7): public.get_access_tier(), public.admin_list_users(), document_events_document_idx, documents_owner_created_idx, documents_owner_fingerprint_key, public.document_events, public.documents

### Community 51 - "20260518212230_77cfae76-ddf9-4e2b-88fa-1d9b251d7daf.sql"
Cohesion: 0.39
Nodes (7): ai_analysis_quota_updated_at, public.ai_analysis_quota, public.repair_analyses, public.repair_pricing_rules, repair_analyses_updated_at, repair_pricing_rules_active_uniq, repair_pricing_rules_version_uniq

### Community 52 - "process-repair-queue/index.ts"
Cohesion: 0.21
Nodes (9): callVision(), clamp01(), corsHeaders, emptyLineItems(), Observations, OBSERVATIONS_SCHEMA, priceRepairs(), PricingRules (+1 more)

### Community 53 - "reviews"
Cohesion: 0.10
Nodes (20): drafts, enabled, chat, auto_reply, knowledge_base, learnings, language, scope (+12 more)

### Community 54 - "Welcome to your Lovable project"
Cohesion: 0.29
Nodes (6): Can I connect a custom domain to my Lovable project?, How can I deploy this project?, How can I edit this code?, Project info, Welcome to your Lovable project, What technologies are used for this project?

### Community 56 - "Card"
Cohesion: 0.22
Nodes (26): APPLIANCE_KEYS, FIELDS, NumericKey, RepairPricingEditor(), RepairBreakdownPanel(), Card, CardContent, CardDescription (+18 more)

### Community 57 - "auth.users"
Cohesion: 0.16
Nodes (14): public.has_role(), public.user_roles, on_auth_user_created_profile, on_auth_user_created, public.admin_list_users(), public.handle_new_user(), public.portal_access_requests, public.profiles (+6 more)

### Community 58 - "20261109130000_0709_crm_messages.sql"
Cohesion: 0.39
Nodes (7): crm_message_sends_contact_idx, crm_messages_contact_idx, public.crm_feature_flags, public.crm_message_sends, public.crm_message_templates, public.crm_messages, public.crm_needs_reply

### Community 59 - "previewAuthStorage.ts"
Cohesion: 0.33
Nodes (6): brokeredPreviewStorage(), BrokerReply, BrokerRequest, BrokerRequestType, PreviewAuthStorage, readBrokerReply()

### Community 60 - "crmPipelinesCalls.test.ts"
Cohesion: 0.08
Nodes (41): BookingResult, CallBooking, callCompleteness(), CallRecord, CallStore, CallTransport, createCallStore(), fakeCallTransport() (+33 more)

### Community 61 - "sidebar.tsx"
Cohesion: 0.08
Nodes (29): Sidebar, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel (+21 more)

### Community 62 - "20260518231855_ecf4842a-193b-4756-8bac-85b8268a90b1.sql"
Cohesion: 0.70
Nodes (4): idx_saved_deals_property_key, idx_saved_deals_user, public.saved_deals, trg_saved_deals_updated_at

### Community 63 - "PortalPartnerProfile.tsx"
Cohesion: 0.26
Nodes (10): Separator, getContractors(), getPartnerById(), getPartnersByType(), NetworkPartner, networkPartners, PartnerType, PortalLocalNetwork() (+2 more)

### Community 64 - "compReports.ts"
Cohesion: 0.18
Nodes (22): useCompReport(), UseCompReportArgs, UseCompReportReturn, buildSummary(), closeReport(), CompReportRow, computeSnapshotStatus(), derivePropertyKey() (+14 more)

### Community 65 - "dotloop-send-baa/index.ts"
Cohesion: 0.25
Nodes (5): corsHeaders, DOTLOOP_BAA_TEMPLATE_ID, DOTLOOP_PROFILE_ID, DOTLOOP_TOKEN, DotloopSendResult

### Community 66 - "CompArvPanel.tsx"
Cohesion: 0.16
Nodes (12): CompArvPanel(), CompRow(), fmt(), Props, tierColor, buildCompEvidence(), caveats(), CompEvidenceRow (+4 more)

### Community 67 - "Access tier model"
Cohesion: 0.29
Nodes (6): Access tier model, Backend enforcement, Dotloop integration (not yet wired), Onboarding wizard, Profile fields added, Required at signup (`src/pages/Signup.tsx`)

### Community 68 - "public.crm_contacts"
Cohesion: 0.27
Nodes (15): crm_contact_consent_contact_idx, crm_contact_events_contact_idx, crm_contact_facts_lookup_idx, crm_contact_methods_match_idx, crm_contacts_active_idx, public.crm_contact_consent, public.crm_contact_events, public.crm_contact_facts (+7 more)

### Community 85 - "steps"
Cohesion: 0.13
Nodes (14): runs-on, steps, jobs, build-and-test, name, on, pull_request, branches (+6 more)

### Community 86 - "Landing 2 — prepared DNS record set + info@ setup (NOT applied)"
Cohesion: 0.33
Nodes (5): 1. info@integrityrealtystl.com (receive side), 2. Resend domain verification (send subdomain), 3. Root domain: SPF + Google DKIM + DMARC (open since 2026-10-24), 4. Apply order, Landing 2 — prepared DNS record set + info@ setup (NOT applied)

### Community 87 - "App.tsx"
Cohesion: 0.24
Nodes (8): App(), queryClient, AdminPortalLayout(), About(), NotFound(), PortalDashboard(), Privacy(), Terms()

### Community 88 - "InvestorListingPage.tsx"
Cohesion: 0.27
Nodes (12): @tanstack/react-query, DetailRow(), ListingDetailBase(), ListingDetailBaseProps, RawListing, computeDealMetrics(), createDeal(), estimateRehabTier() (+4 more)

### Community 90 - "dialog.tsx"
Cohesion: 0.27
Nodes (8): ListingPhotoModal(), ListingPhotoModalProps, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle

### Community 91 - "CompReportStatus.tsx"
Cohesion: 0.25
Nodes (8): CompReportStatus(), formatCurrency(), Props, STATUS_CLASS, STATUS_LABEL, timeAgo(), SnapshotStatus, SubjectDiff

### Community 92 - "@vitejs/plugin-react-swc"
Cohesion: 0.25
Nodes (6): lovable-tagger@^1.1.13, vite@^5.4.19, @vitejs/plugin-react-swc@^3.11.0, lovable-tagger, vite, @vitejs/plugin-react-swc

### Community 93 - "20261109140000_0709_crm_pipelines_calls.sql"
Cohesion: 0.33
Nodes (8): crm_lead_assignments_active_idx, public.crm_call_bookings, public.crm_calls, public.crm_incomplete_calls, public.crm_lead_assignments, public.crm_pipeline_places, public.crm_pipelines, public.crm_visible_contacts

### Community 94 - "sonner"
Cohesion: 0.29
Nodes (6): next-themes@^0.3.0, sonner@^1.7.4, next-themes, sonner, Toaster(), ToasterProps

## Knowledge Gaps
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `AdminUsers.tsx`, `DealUnderwritingPanel.tsx`, `package.json`, `documents.ts`, `email-schedules.ts`, `repair-queue.ts`, `@vitejs/plugin-react-swc`, `crmContacts.ts`, `crmMessages.test.ts`, `crmPipelinesCalls.test.ts`?**
  _High betweenness centrality (0.183) - this node is a cross-community bridge._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.058758006126427176 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `cn` to `Button`, `AdminUsers.tsx`, `zip-combobox.tsx`, `DealUnderwritingPanel.tsx`, `DealAnalyzer.tsx`, `utils.ts`, `PortalSearchAnalyzer.tsx`, `BatchAnalysisTable.tsx`, `InvestorPortalLayout.tsx`, `carousel.tsx`, `form.tsx`, `toast.tsx`, `chart.tsx`, `sheet.tsx`, `pagination.tsx`, `navigation-menu.tsx`, `drawer.tsx`, `Card`, `sidebar.tsx`, `PortalPartnerProfile.tsx`, `App.tsx`, `InvestorListingPage.tsx`, `dialog.tsx`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.05042016806722689 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `lucide-react`, `AdminUsers.tsx`, `dependencies`, `cn`, `zip-combobox.tsx`, `DealUnderwritingPanel.tsx`, `DealAnalyzer.tsx`, `lib/compArv.ts`, `utils.ts`, `documents.ts`, `PortalSearchAnalyzer.tsx`, `BatchAnalysisTable.tsx`, `DealAlertSettings.tsx`, `InvestorPortalLayout.tsx`, `carousel.tsx`, `form.tsx`, `toast.tsx`, `Section8Calculator.tsx`, `chart.tsx`, `sheet.tsx`, `package.json`, `pagination.tsx`, `navigation-menu.tsx`, `drawer.tsx`, `Card`, `sidebar.tsx`, `PortalPartnerProfile.tsx`, `compReports.ts`, `CompArvPanel.tsx`, `App.tsx`, `InvestorListingPage.tsx`, `dialog.tsx`, `CallBookingForm.tsx`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.06140350877192982 - nodes in this community are weakly interconnected._