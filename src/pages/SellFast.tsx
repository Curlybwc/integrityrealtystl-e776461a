import Layout from "@/components/Layout";
import { Zap } from "lucide-react";

const SellFast = () => {
  return (
    <Layout>
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
            <Zap className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
            Sell Your House As-Is for Cash
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            A fast, no-repairs option for distressed situations or when you need a quick closing.
          </p>
          <div className="bg-card border border-border rounded-lg p-8 shadow-card">
            <p className="text-muted-foreground">
              This page is coming soon. Contact us for a no-obligation cash offer.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SellFast;
