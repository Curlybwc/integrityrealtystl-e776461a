import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Invest from "./pages/Invest";
import Buyers from "./pages/Buyers";
import Sellers from "./pages/Sellers";
import SellFast from "./pages/SellFast";
import Wholesalers from "./pages/Wholesalers";
import Login from "./pages/Login";
import WholesalerLogin from "./pages/WholesalerLogin";
import PartnerLogin from "./pages/PartnerLogin";
import AdminLogin from "./pages/AdminLogin";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NetworkPartner from "./pages/NetworkPartner";
import PublicListingPage from "./pages/PublicListingPage";
import NotFound from "./pages/NotFound";
import PortalSelector from "@/pages/PortalSelector";

// Investor Portal pages
import InvestorPortalLayout from "./components/portal/InvestorPortalLayout";
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalDealsHub from "./pages/portal/PortalDealsHub";
import PortalMlsDeals from "./pages/portal/PortalMlsDeals";
import PortalWholesaleDeals from "./pages/portal/PortalWholesaleDeals";
import PortalDealAlerts from "./pages/portal/PortalDealAlerts";
import PortalDealDetail from "./pages/portal/PortalDealDetail";
import PortalSubmitOffer from "./pages/portal/PortalSubmitOffer";
import PortalRequestWalkthrough from "./pages/portal/PortalRequestWalkthrough";
import PortalBidRequest from "./pages/portal/PortalBidRequest";
import PortalPaidConsult from "./pages/portal/PortalPaidConsult";
import PortalMyBids from "./pages/portal/PortalMyBids";
import PortalMyOffers from "./pages/portal/PortalMyOffers";
import PortalConsulting from "./pages/portal/PortalConsulting";
import PortalAnalyzer from "./pages/portal/PortalAnalyzer";
import PortalSection8Calculator from "./pages/portal/PortalSection8Calculator";
import PortalLocalNetwork from "./pages/portal/PortalLocalNetwork";
import PortalPartnerProfile from "./pages/portal/PortalPartnerProfile";
import PortalResources from "./pages/portal/PortalResources";
import PortalLinks from "./pages/portal/PortalLinks";
import PortalDocuments from "./pages/portal/PortalDocuments";
import PortalAccount from "./pages/portal/PortalAccount";
import PortalSearchAnalyzer from "./pages/portal/PortalSearchAnalyzer";
import InvestorListingPage from "./pages/portal/InvestorListingPage";

// Wholesaler Portal pages
import WholesalerPortalLayout from "./components/wholesaler-portal/WholesalerPortalLayout";
import WholesalerDashboard from "./pages/wholesaler-portal/WholesalerDashboard";
import WholesalerDeals from "./pages/wholesaler-portal/WholesalerDeals";
import WholesalerAddDeal from "./pages/wholesaler-portal/WholesalerAddDeal";
import WholesalerAccount from "./pages/wholesaler-portal/WholesalerAccount";

// Partner Portal pages
import PartnerPortalLayout from "./components/partner-portal/PartnerPortalLayout";
import PartnerDashboard from "./pages/partner-portal/PartnerDashboard";
import PartnerProfile from "./pages/partner-portal/PartnerProfile";
import PartnerTestimonials from "./pages/partner-portal/PartnerTestimonials";

// Admin Portal pages
import AdminPortalLayout from "./components/admin-portal/AdminPortalLayout";
import AdminDashboard from "./pages/admin-portal/AdminDashboard";
import AdminDealPot from "./pages/admin-portal/AdminDealPot";
import AdminMlsImport from "./pages/admin-portal/AdminMlsImport";
import AdminSettings from "./pages/admin-portal/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/invest" element={<Invest />} />
          <Route path="/buyers" element={<Buyers />} />
          <Route path="/sellers" element={<Sellers />} />
          <Route path="/sellfast" element={<SellFast />} />
          <Route path="/wholesalers" element={<Wholesalers />} />
          <Route path="/login" element={<Login />} />
          <Route path="/wholesaler-login" element={<WholesalerLogin />} />
          <Route path="/partner-login" element={<PartnerLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/network-partner" element={<NetworkPartner />} />
          <Route path="/listing/:mlsNumber" element={<PublicListingPage />} />
          <Route path="/portals" element={<PortalSelector />} />

          {/* Investor Portal routes */}
          <Route path="/portal" element={<InvestorPortalLayout />}>
            <Route index element={<PortalDashboard />} />
            <Route path="deals" element={<PortalDealsHub />} />
            <Route path="deals/mls" element={<PortalMlsDeals />} />
            <Route path="deals/wholesale" element={<PortalWholesaleDeals />} />
            <Route path="deals/alerts" element={<PortalDealAlerts />} />
            <Route path="deals/:dealId" element={<PortalDealDetail />} />
            <Route path="deals/:dealId/offer" element={<PortalSubmitOffer />} />
            <Route path="deals/:dealId/walkthrough" element={<PortalRequestWalkthrough />} />
            <Route path="deals/:dealId/bid" element={<PortalBidRequest />} />
            <Route path="deals/:dealId/consult" element={<PortalPaidConsult />} />
            <Route path="my-offers" element={<PortalMyOffers />} />
            <Route path="my-bids" element={<PortalMyBids />} />
            <Route path="consulting" element={<PortalConsulting />} />
            <Route path="analyzer" element={<PortalAnalyzer />} />
            <Route path="section8-calculator" element={<PortalSection8Calculator />} />
            <Route path="local-network" element={<PortalLocalNetwork />} />
            <Route path="partner/:partnerId" element={<PortalPartnerProfile />} />
            <Route path="resources" element={<PortalResources />} />
            <Route path="links" element={<PortalLinks />} />
            <Route path="documents" element={<PortalDocuments />} />
            <Route path="account" element={<PortalAccount />} />
            <Route path="search-analyzer" element={<PortalSearchAnalyzer />} />
            <Route path="listing/:mlsNumber" element={<InvestorListingPage />} />
          </Route>

          {/* Wholesaler Portal routes */}
          <Route path="/wholesaler-portal" element={<WholesalerPortalLayout />}>
            <Route index element={<WholesalerDashboard />} />
            <Route path="deals" element={<WholesalerDeals />} />
            <Route path="add-deal" element={<WholesalerAddDeal />} />
            <Route path="account" element={<WholesalerAccount />} />
          </Route>

          {/* Partner Portal routes */}
          <Route path="/partner-portal" element={<PartnerPortalLayout />}>
            <Route index element={<PartnerDashboard />} />
            <Route path="profile" element={<PartnerProfile />} />
            <Route path="testimonials" element={<PartnerTestimonials />} />
          </Route>

          {/* Admin Portal routes */}
          <Route path="/admin" element={<AdminPortalLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="deal-pot" element={<AdminDealPot />} />
            <Route path="mls-import" element={<AdminMlsImport />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
