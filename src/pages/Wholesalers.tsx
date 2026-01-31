import Layout from "@/components/Layout";
import WholesalerHero from "@/components/wholesaler/WholesalerHero";
import WholesalerActions from "@/components/wholesaler/WholesalerActions";
import WholesalerBenefits from "@/components/wholesaler/WholesalerBenefits";
import WholesalerProcess from "@/components/wholesaler/WholesalerProcess";
import WholesalerApplicationForm from "@/components/wholesaler/WholesalerApplicationForm";
import WholesalerDisclaimers from "@/components/wholesaler/WholesalerDisclaimers";

const Wholesalers = () => {
  return (
    <Layout>
      <WholesalerHero />
      <WholesalerActions />
      <WholesalerBenefits />
      <WholesalerProcess />
      <WholesalerApplicationForm />
      <WholesalerDisclaimers />
    </Layout>
  );
};

export default Wholesalers;
