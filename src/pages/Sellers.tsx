import Layout from "@/components/Layout";
import SellerHero from "@/components/seller/SellerHero";
import SellerValueProposition from "@/components/seller/SellerValueProposition";
import SellerProcess from "@/components/seller/SellerProcess";
import SellerPricingEducation from "@/components/seller/SellerPricingEducation";
import SellerTestimonials from "@/components/seller/SellerTestimonials";
import SellerRepresentationDisclosure from "@/components/seller/SellerRepresentationDisclosure";
import SellerIntakeForm from "@/components/seller/SellerIntakeForm";
import SellerDisclaimers from "@/components/seller/SellerDisclaimers";

const Sellers = () => {
  return (
    <Layout>
      <SellerHero />
      <SellerValueProposition />
      <SellerProcess />
      <SellerPricingEducation />
      <SellerTestimonials />
      <SellerRepresentationDisclosure />
      <SellerIntakeForm />
      <SellerDisclaimers />
    </Layout>
  );
};

export default Sellers;
