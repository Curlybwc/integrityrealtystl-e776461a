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
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Investor Portal pages
import InvestorPortalLayout from "./components/portal/InvestorPortalLayout";
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalDeals from "./pages/portal/PortalDeals";
import PortalDealDetail from "./pages/portal/PortalDealDetail";
import PortalSubmitOffer from "./pages/portal/PortalSubmitOffer";
import PortalRequestWalkthrough from "./pages/portal/PortalRequestWalkthrough";
import PortalBidRequest from "./pages/portal/PortalBidRequest";
import PortalPaidConsult from "./pages/portal/PortalPaidConsult";
import PortalMyBids from "./pages/portal/PortalMyBids";
import PortalMyOffers from "./pages/portal/PortalMyOffers";
import PortalConsulting from "./pages/portal/PortalConsulting";
import PortalAnalyzer from "./pages/portal/PortalAnalyzer";
import PortalResources from "./pages/portal/PortalResources";
import PortalDocuments from "./pages/portal/PortalDocuments";
import PortalAccount from "./pages/portal/PortalAccount";

// Wholesaler Portal pages
import WholesalerPortalLayout from "./components/wholesaler-portal/WholesalerPortalLayout";
import WholesalerDashboard from "./pages/wholesaler-portal/WholesalerDashboard";
import WholesalerDeals from "./pages/wholesaler-portal/WholesalerDeals";
import WholesalerAddDeal from "./pages/wholesaler-portal/WholesalerAddDeal";
import WholesalerAccount from "./pages/wholesaler-portal/WholesalerAccount";

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
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Investor Portal routes */}
          <Route path="/portal" element={<InvestorPortalLayout />}>
            <Route index element={<PortalDashboard />} />
            <Route path="deals" element={<PortalDeals />} />
            <Route path="deals/:dealId" element={<PortalDealDetail />} />
            <Route path="deals/:dealId/offer" element={<PortalSubmitOffer />} />
            <Route path="deals/:dealId/walkthrough" element={<PortalRequestWalkthrough />} />
            <Route path="deals/:dealId/bid" element={<PortalBidRequest />} />
            <Route path="deals/:dealId/consult" element={<PortalPaidConsult />} />
            <Route path="my-offers" element={<PortalMyOffers />} />
            <Route path="my-bids" element={<PortalMyBids />} />
            <Route path="consulting" element={<PortalConsulting />} />
            <Route path="analyzer" element={<PortalAnalyzer />} />
            <Route path="resources" element={<PortalResources />} />
            <Route path="documents" element={<PortalDocuments />} />
            <Route path="account" element={<PortalAccount />} />
          </Route>

          {/* Wholesaler Portal routes */}
          <Route path="/wholesaler-portal" element={<WholesalerPortalLayout />}>
            <Route index element={<WholesalerDashboard />} />
            <Route path="deals" element={<WholesalerDeals />} />
            <Route path="add-deal" element={<WholesalerAddDeal />} />
            <Route path="account" element={<WholesalerAccount />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
