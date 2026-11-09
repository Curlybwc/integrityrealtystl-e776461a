# Graph Report - integrity-git  (2026-11-09)

## Corpus Check
- 307 files · ~138,931 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .css 2, (none) 1, .lock 1)

## Summary
- 1666 nodes · 5320 edges · 105 communities (71 shown, 34 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.9)
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
- DealUnderwritingPanel.tsx
- AdminUsersInvite.test.tsx
- sidebar.tsx
- devDependencies
- DealAnalyzer.tsx
- lib/compArv.ts
- utils.ts
- documents.ts
- repliers-sold.ts
- sold-export.ts
- Badge
- DealAlertSettings.tsx
- scripts
- crmContacts.ts
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
- PortalSelector.tsx
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
- formatCurrency
- drawer.tsx
- 20261103210000_0706_document_catalog.sql
- 20260518212230_77cfae76-ddf9-4e2b-88fa-1d9b251d7daf.sql
- email-schedules.ts
- reviews
- Welcome to your Lovable project
- send-deal-alert/index.ts
- Index.tsx
- auth.users
- previewAuthStorage.ts
- InvestorPortalLayout.tsx
- input-otp
- 20260309120000_harden_user_roles_auth.sql
- 20260518231855_ecf4842a-193b-4756-8bac-85b8268a90b1.sql
- public.user_roles
- on_auth_user_created_assign_first_user_roles
- public.user_roles
- CompArvPanel.tsx
- screening.ts
- 20261109120000_0709_crm_contacts_groups.sql
- public.get_cron_wake_token
- roadmap.md
- steps
- useDeals
- dialog.tsx
- CompReportStatus.tsx
- vitest
- crmContacts.test.ts
- @vitejs/plugin-react-swc
- repairPricing.ts
- sonner.tsx
- aspect-ratio.tsx
- collapsible.tsx
- clsx
- fflate
- @fontsource/playfair-display@^5.2.8
- @radix-ui/react-alert-dialog
- @radix-ui/react-hover-card
- @radix-ui/react-separator
- react-resizable-panels
- tailwind-merge

## God Nodes (most connected - your core abstractions)
1. `cn()` - 260 edges
2. `Button` - 165 edges
3. `lucide-react` - 137 edges
4. `react` - 126 edges
5. `Input` - 87 edges
6. `Label` - 85 edges
7. `useToast()` - 72 edges
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

## Communities (105 total, 34 thin omitted)

### Community 0 - "Button"
Cohesion: 0.08
Nodes (91): react, react-router-dom, DealPhotoViewer(), DealPhotoViewerProps, DealPotTableProps, BuyerIntakeForm(), Footer(), Header() (+83 more)

### Community 1 - "lucide-react"
Cohesion: 0.06
Nodes (39): lucide-react, BuyerDisclaimers(), BuyerHero(), BuyerProcess(), BuyerRepresentationDisclosure(), BuyerSearchCTA(), BuyerTestimonials(), BuyerValueProposition() (+31 more)

### Community 2 - "App.tsx"
Cohesion: 0.05
Nodes (111): @supabase/supabase-js, @tanstack/react-query, App(), queryClient, DealPotTable(), APPLIANCE_KEYS, FIELDS, NumericKey (+103 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (41): dependencies, cmdk@^1.1.1, @hookform/resolvers@^3.10.0, lucide-react@^0.462.0, @radix-ui/react-checkbox@^1.3.2, @radix-ui/react-context-menu@^2.2.15, @radix-ui/react-menubar@^1.1.15, @radix-ui/react-navigation-menu@^1.2.13 (+33 more)

### Community 4 - "cn"
Cohesion: 0.06
Nodes (50): AccordionContent, AccordionItem, AccordionTrigger, Avatar, AvatarFallback, AvatarImage, Breadcrumb, BreadcrumbEllipsis() (+42 more)

### Community 5 - "zip-combobox.tsx"
Cohesion: 0.13
Nodes (19): GatedAction(), Props, tierRank, Command, CommandDialog(), CommandDialogProps, CommandEmpty, CommandGroup (+11 more)

### Community 6 - "useAccessTier"
Cohesion: 0.08
Nodes (31): Access tier model, Backend enforcement, Dotloop integration (not yet wired), Frontend enforcement, Onboarding wizard, Profile fields added, Required at signup (`src/pages/Signup.tsx`), BAA requirement (Investor + Buyer only) (+23 more)

### Community 7 - "DealUnderwritingPanel.tsx"
Cohesion: 0.16
Nodes (24): DealUnderwritingPanel(), Metric(), moneyInput(), Props, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription (+16 more)

### Community 8 - "AdminUsersInvite.test.tsx"
Cohesion: 0.18
Nodes (3): openInviteDialog(), { rpc, from, invoke, getSession, toast }, CallerClient

### Community 9 - "sidebar.tsx"
Cohesion: 0.08
Nodes (28): SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader (+20 more)

### Community 10 - "devDependencies"
Cohesion: 0.06
Nodes (34): devDependencies, autoprefixer@^10.4.21, eslint@^9.32.0, @eslint/js@^9.32.0, eslint-plugin-react-hooks@^5.2.0, eslint-plugin-react-refresh@^0.4.20, globals@^15.15.0, jsdom@^20.0.3 (+26 more)

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
Cohesion: 0.12
Nodes (16): blobBytes(), CatalogDocument, createDocumentsService(), DOCUMENT_KIND_LABELS, DOCUMENT_KINDS, DocumentKind, DocumentsClient, documentsService (+8 more)

### Community 15 - "repliers-sold.ts"
Cohesion: 0.18
Nodes (17): emptyResponse(), request, response(), createFetchSoldListingsHandler(), soldReportCorsHeaders, extractSoldDate(), fetchSoldListings(), isObject() (+9 more)

### Community 16 - "sold-export.ts"
Cohesion: 0.26
Nodes (11): exportFile(), row, buildSoldExport(), csvCell(), SOLD_EXPORT_COLUMNS, SoldExportFormat, values(), workbook() (+3 more)

### Community 17 - "Badge"
Cohesion: 0.20
Nodes (13): sonner, SendDealAlertPanel(), RepairQuotaChip(), Badge(), BadgeProps, badgeVariants, TabsContent, TabsList (+5 more)

### Community 18 - "DealAlertSettings.tsx"
Cohesion: 0.28
Nodes (14): DealAlertSettings(), SOURCES, STRATEGIES, disablePushOnThisDevice(), enablePushOnThisDevice(), encodeKey(), getRegistration(), isIos() (+6 more)

### Community 19 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:dev, dev, lint, preview, test, test:watch

### Community 20 - "crmContacts.ts"
Cohesion: 0.12
Nodes (26): addFactsOnce(), addMethodsOnce(), addSourceOnce(), arrivalMethods(), ContactEvent, ContactFact, ContactMethod, ContactSource (+18 more)

### Community 21 - "20260309130000_admin_user_control_center.sql"
Cohesion: 0.20
Nodes (18): admin_audit_log_actor_idx, admin_audit_log_created_at_idx, admin_audit_log_target_idx, portal_access_requests_set_updated_at, portal_access_requests_status_idx, portal_access_requests_user_id_idx, profiles_set_updated_at, public.admin_audit_log (+10 more)

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
Cohesion: 0.18
Nodes (22): useCompReport(), UseCompReportArgs, UseCompReportReturn, buildSummary(), closeReport(), CompReportRow, computeSnapshotStatus(), derivePropertyKey() (+14 more)

### Community 26 - "fetch-comp-arv/index.ts"
Cohesion: 0.09
Nodes (27): ADJ, adjust(), assignTier(), CompTier, corsHeaders, EligibilityStage, evalElig(), FinishTier (+19 more)

### Community 27 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 28 - "ref_https"
Cohesion: 0.08
Nodes (14): corsHeaders, ALLOWED_ROLES, corsHeaders, corsHeaders, ALLOWED, corsHeaders, corsHeaders, corsHeaders (+6 more)

### Community 29 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+7 more)

### Community 30 - "carousel.tsx"
Cohesion: 0.19
Nodes (13): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+5 more)

### Community 31 - "PortalSelector.tsx"
Cohesion: 0.33
Nodes (6): useHasRole(), UseHasRoleResult, useUserRoles(), UseUserRolesResult, allPortals, PortalSelector()

### Community 32 - "Daily Property Harvest – Implementation Plan"
Cohesion: 0.14
Nodes (13): 1. Database Table: `deals`, 2. Edge Function: `daily-mls-harvest`, 3. Cron Schedule, 4. Frontend: `/deals` Page, 5. Admin Trigger, Behavior, Columns, Daily Property Harvest – Implementation Plan (+5 more)

### Community 33 - "form.tsx"
Cohesion: 0.14
Nodes (16): @radix-ui/react-label@^2.1.7, @radix-ui/react-slot@^1.2.3, react-hook-form@^7.61.1, @radix-ui/react-label, @radix-ui/react-slot, react-hook-form, FormControl, FormDescription (+8 more)

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
Cohesion: 0.20
Nodes (11): @radix-ui/react-dialog@^1.1.14, @radix-ui/react-dialog, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+3 more)

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
Cohesion: 0.06
Nodes (30): date-fns@^3.6.0, embla-carousel-react@^8.6.0, @fontsource/inter@^5.2.8, @radix-ui/react-accordion@^1.2.11, @radix-ui/react-avatar@^1.1.10, @radix-ui/react-dropdown-menu@^2.1.15, @radix-ui/react-popover@^1.1.14, @radix-ui/react-slider@^1.3.5 (+22 more)

### Community 45 - "pagination.tsx"
Cohesion: 0.24
Nodes (9): ButtonProps, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem, PaginationLink(), PaginationLinkProps, PaginationNext() (+1 more)

### Community 46 - "repair-queue.ts"
Cohesion: 0.07
Nodes (33): NOW, computeEvidenceHash(), corsHeaders, ListingSnapshot, normalizeRemarks(), sha1(), callVision(), clamp01() (+25 more)

### Community 47 - "navigation-menu.tsx"
Cohesion: 0.19
Nodes (11): class-variance-authority@^0.7.1, class-variance-authority, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle (+3 more)

### Community 48 - "formatCurrency"
Cohesion: 0.23
Nodes (17): CheckMlsUpdatesButton(), Chip(), LiveSnapshot, Props, SaveDealButton(), Toast, useSavedDeals(), buildSnapshotFromDeal() (+9 more)

### Community 49 - "drawer.tsx"
Cohesion: 0.29
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 50 - "20261103210000_0706_document_catalog.sql"
Cohesion: 0.29
Nodes (7): public.get_access_tier(), public.admin_list_users(), document_events_document_idx, documents_owner_created_idx, documents_owner_fingerprint_key, public.document_events, public.documents

### Community 51 - "20260518212230_77cfae76-ddf9-4e2b-88fa-1d9b251d7daf.sql"
Cohesion: 0.39
Nodes (7): ai_analysis_quota_updated_at, public.ai_analysis_quota, public.repair_analyses, public.repair_pricing_rules, repair_analyses_updated_at, repair_pricing_rules_active_uniq, repair_pricing_rules_version_uniq

### Community 52 - "email-schedules.ts"
Cohesion: 0.16
Nodes (15): row, schedule, corsHeaders, EmailSchedule, getNewSoldRows(), getScheduleCadenceBucket(), getSoldSchedulePlan(), processEmailSchedule() (+7 more)

### Community 53 - "reviews"
Cohesion: 0.10
Nodes (20): drafts, enabled, chat, auto_reply, knowledge_base, learnings, language, scope (+12 more)

### Community 54 - "Welcome to your Lovable project"
Cohesion: 0.29
Nodes (6): Can I connect a custom domain to my Lovable project?, How can I deploy this project?, How can I edit this code?, Project info, Welcome to your Lovable project, What technologies are used for this project?

### Community 56 - "Index.tsx"
Cohesion: 0.29
Nodes (7): AboutSection(), AudienceCard(), AudienceCardProps, audiences, AudienceSection(), HeroSection(), Index()

### Community 57 - "auth.users"
Cohesion: 0.26
Nodes (10): on_auth_user_created_profile, on_auth_user_created, public.admin_list_users(), public.handle_new_user(), public.portal_access_requests, public.profiles, public.alert_preferences, public.deal_alerts_sent (+2 more)

### Community 58 - "previewAuthStorage.ts"
Cohesion: 0.33
Nodes (6): brokeredPreviewStorage(), BrokerReply, BrokerRequest, BrokerRequestType, PreviewAuthStorage, readBrokerReply()

### Community 59 - "InvestorPortalLayout.tsx"
Cohesion: 0.19
Nodes (14): AdminPortalLayout(), navItems, PartnerPortalLayout(), AccessTierBanner(), Props, InvestorPortalLayout(), navItems, navItems (+6 more)

### Community 62 - "20260518231855_ecf4842a-193b-4756-8bac-85b8268a90b1.sql"
Cohesion: 0.70
Nodes (4): idx_saved_deals_property_key, idx_saved_deals_user, public.saved_deals, trg_saved_deals_updated_at

### Community 66 - "CompArvPanel.tsx"
Cohesion: 0.16
Nodes (12): CompArvPanel(), CompRow(), fmt(), Props, tierColor, buildCompEvidence(), caveats(), CompEvidenceRow (+4 more)

### Community 67 - "screening.ts"
Cohesion: 0.18
Nodes (11): ListingCard(), ListingCardProps, Switch, formatPercent(), getScoringStatus(), MlsStatus, ScoringStatus, SourceType (+3 more)

### Community 68 - "20261109120000_0709_crm_contacts_groups.sql"
Cohesion: 0.27
Nodes (15): crm_contact_consent_contact_idx, crm_contact_events_contact_idx, crm_contact_facts_lookup_idx, crm_contact_methods_match_idx, crm_contacts_active_idx, public.crm_contact_consent, public.crm_contact_events, public.crm_contact_facts (+7 more)

### Community 85 - "steps"
Cohesion: 0.13
Nodes (14): runs-on, steps, jobs, build-and-test, name, on, pull_request, branches (+6 more)

### Community 86 - "useDeals"
Cohesion: 0.33
Nodes (9): loadDeals(), MOCK_DEALS, resetDeals(), SAMPLE_PHOTOS, saveDeals(), useDeals(), Deal, updateDeal() (+1 more)

### Community 87 - "dialog.tsx"
Cohesion: 0.27
Nodes (8): ListingPhotoModal(), ListingPhotoModalProps, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle

### Community 88 - "CompReportStatus.tsx"
Cohesion: 0.25
Nodes (8): CompReportStatus(), formatCurrency(), Props, STATUS_CLASS, STATUS_LABEL, timeAgo(), SnapshotStatus, SubjectDiff

### Community 90 - "vitest"
Cohesion: 0.22
Nodes (7): @testing-library/react@^16.0.0, @testing-library/react, vitest, h, pendingRequest, { from, loadSchedules, update, eq, selectUpdate, saveSchedule }, schedule

### Community 91 - "crmContacts.test.ts"
Cohesion: 0.36
Nodes (9): addGroup(), createStore(), CrmStore, joinGroup(), leaveGroup(), setDoNotContact(), unmerge(), seedStore() (+1 more)

### Community 92 - "@vitejs/plugin-react-swc"
Cohesion: 0.25
Nodes (6): lovable-tagger@^1.1.13, vite@^5.4.19, @vitejs/plugin-react-swc@^3.11.0, lovable-tagger, vite, @vitejs/plugin-react-swc

### Community 93 - "repairPricing.ts"
Cohesion: 0.28
Nodes (7): clamp01(), emptyLineItems(), ENGINE_VERSION, priceRepairs(), PriceResult, PricingRules, REPAIR_LINE_LABELS

### Community 94 - "sonner.tsx"
Cohesion: 0.40
Nodes (4): next-themes@^0.3.0, next-themes, Toaster(), ToasterProps

## Knowledge Gaps
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `lucide-react` connect `lucide-react` to `Button`, `App.tsx`, `dependencies`, `cn`, `zip-combobox.tsx`, `useAccessTier`, `DealUnderwritingPanel.tsx`, `sidebar.tsx`, `DealAnalyzer.tsx`, `utils.ts`, `documents.ts`, `Badge`, `DealAlertSettings.tsx`, `carousel.tsx`, `PortalSelector.tsx`, `toast.tsx`, `Section8Calculator.tsx`, `sheet.tsx`, `package.json`, `pagination.tsx`, `navigation-menu.tsx`, `formatCurrency`, `Index.tsx`, `InvestorPortalLayout.tsx`, `CompArvPanel.tsx`, `screening.ts`, `useDeals`, `dialog.tsx`, `CompReportStatus.tsx`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.08194622279129321 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `cn` to `Button`, `App.tsx`, `zip-combobox.tsx`, `DealUnderwritingPanel.tsx`, `sidebar.tsx`, `DealAnalyzer.tsx`, `utils.ts`, `Badge`, `carousel.tsx`, `form.tsx`, `toast.tsx`, `chart.tsx`, `sheet.tsx`, `pagination.tsx`, `navigation-menu.tsx`, `formatCurrency`, `drawer.tsx`, `InvestorPortalLayout.tsx`, `screening.ts`, `dialog.tsx`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.05809979494190021 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `App.tsx`, `dependencies`, `cn`, `zip-combobox.tsx`, `useAccessTier`, `DealUnderwritingPanel.tsx`, `sidebar.tsx`, `DealAnalyzer.tsx`, `lib/compArv.ts`, `utils.ts`, `documents.ts`, `Badge`, `DealAlertSettings.tsx`, `compReports.ts`, `carousel.tsx`, `PortalSelector.tsx`, `form.tsx`, `toast.tsx`, `Section8Calculator.tsx`, `chart.tsx`, `sheet.tsx`, `package.json`, `pagination.tsx`, `navigation-menu.tsx`, `formatCurrency`, `drawer.tsx`, `InvestorPortalLayout.tsx`, `CompArvPanel.tsx`, `screening.ts`, `useDeals`, `dialog.tsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05119396732299958 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._