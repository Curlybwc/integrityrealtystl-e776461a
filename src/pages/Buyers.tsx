import Layout from "@/components/Layout";
import BuyerHero from "@/components/buyer/BuyerHero";
import BuyerValueProposition from "@/components/buyer/BuyerValueProposition";
import BuyerProcess from "@/components/buyer/BuyerProcess";
import BuyerSearchCTA from "@/components/buyer/BuyerSearchCTA";
import BuyerTestimonials from "@/components/buyer/BuyerTestimonials";
import BuyerRepresentationDisclosure from "@/components/buyer/BuyerRepresentationDisclosure";
import BuyerIntakeForm from "@/components/buyer/BuyerIntakeForm";
import BuyerDisclaimers from "@/components/buyer/BuyerDisclaimers";

const Buyers = () => {
  return (
    <Layout>
      <BuyerHero />
      <BuyerValueProposition />
      <BuyerProcess />
      <BuyerSearchCTA />
      <BuyerTestimonials />
      <BuyerRepresentationDisclosure />
      <BuyerIntakeForm />
      <BuyerDisclaimers />
    </Layout>
  );
};

export default Buyers;
