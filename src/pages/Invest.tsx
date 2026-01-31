import Layout from "@/components/Layout";
import InvestorHero from "@/components/investor/InvestorHero";
import InvestorSelfSelection from "@/components/investor/InvestorSelfSelection";
import InvestorPhilosophy from "@/components/investor/InvestorPhilosophy";
import InvestorEducation from "@/components/investor/InvestorEducation";
import InvestorCaseStudies from "@/components/investor/InvestorCaseStudies";
import InvestorTestimonials from "@/components/investor/InvestorTestimonials";
import InvestorDisclaimers from "@/components/investor/InvestorDisclaimers";
import InvestorIntakeForm from "@/components/investor/InvestorIntakeForm";
import InvestorCTA from "@/components/investor/InvestorCTA";

const Invest = () => {
  return (
    <Layout>
      <InvestorHero />
      <InvestorSelfSelection />
      <InvestorPhilosophy />
      <InvestorEducation />
      <InvestorCaseStudies />
      <InvestorTestimonials />
      <InvestorDisclaimers />
      <InvestorIntakeForm />
      <InvestorCTA />
    </Layout>
  );
};

export default Invest;
