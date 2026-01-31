import Layout from "@/components/Layout";
import { TrendingUp } from "lucide-react";

const Invest = () => {
  return (
    <Layout>
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
            Invest with Integrity
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Build lasting wealth through curated long-term rental investment opportunities in the St. Louis market.
          </p>
          <div className="bg-card border border-border rounded-lg p-8 shadow-card">
            <p className="text-muted-foreground">
              This page is coming soon. Contact us to learn about our current investment opportunities.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Invest;
