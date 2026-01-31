import Layout from "@/components/Layout";
import SellFastHero from "@/components/sellfast/SellFastHero";
import SellFastVideo from "@/components/sellfast/SellFastVideo";
import SellFastValueProposition from "@/components/sellfast/SellFastValueProposition";
import SellFastComparison from "@/components/sellfast/SellFastComparison";
import SellFastTestimonials from "@/components/sellfast/SellFastTestimonials";
import SellFastDisclaimers from "@/components/sellfast/SellFastDisclaimers";
import SellFastIntakeForm from "@/components/sellfast/SellFastIntakeForm";

const SellFast = () => {
  return (
    <Layout>
      <SellFastHero />
      <SellFastVideo />
      <SellFastValueProposition />
      <SellFastComparison />
      <SellFastTestimonials />
      <SellFastDisclaimers />
      <SellFastIntakeForm />
    </Layout>
  );
};

export default SellFast;
