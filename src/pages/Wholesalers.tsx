import Layout from "@/components/Layout";
import { Handshake } from "lucide-react";

const Wholesalers = () => {
  return (
    <Layout>
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
            <Handshake className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
            Submit a Wholesale Deal
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Share off-market opportunities with our team and build a profitable partnership.
          </p>
          <div className="bg-card border border-border rounded-lg p-8 shadow-card">
            <p className="text-muted-foreground">
              This page is coming soon. Contact us to submit your wholesale deals.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Wholesalers;
