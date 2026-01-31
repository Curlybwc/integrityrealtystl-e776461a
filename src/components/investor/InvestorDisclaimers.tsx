import { AlertTriangle, Scale, FileText, TrendingDown } from "lucide-react";

const InvestorDisclaimers = () => {
  const disclaimers = [
    {
      icon: TrendingDown,
      title: "Investment Risk",
      text: "Real estate investing involves substantial risk of loss. Property values, rental income, and market conditions can change unpredictably.",
    },
    {
      icon: AlertTriangle,
      title: "No Guarantees",
      text: "Integrity Realty STL does not guarantee returns, cash flow, appreciation, or deal availability. Past performance does not predict future results.",
    },
    {
      icon: FileText,
      title: "Due Diligence Required",
      text: "All investors are responsible for conducting their own due diligence. We provide information and guidance, not investment advice.",
    },
    {
      icon: Scale,
      title: "Market Conditions",
      text: "Rents, expenses, vacancy rates, and property values are subject to market forces beyond anyone's control or prediction.",
    },
  ];

  return (
    <section className="py-16 px-6 bg-secondary/30">
      <div className="container mx-auto max-w-4xl">
        <h2 className="font-serif text-2xl text-center text-foreground mb-8">
          Important Disclosures
        </h2>

        <div className="grid sm:grid-cols-2 gap-6">
          {disclaimers.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-4 bg-card border border-border rounded-lg p-5"
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-sm mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 max-w-2xl mx-auto">
          By engaging with Integrity Realty STL, you acknowledge that you have read 
          and understood these disclosures. We encourage all investors to consult with 
          qualified financial, legal, and tax advisors before making investment decisions.
        </p>
      </div>
    </section>
  );
};

export default InvestorDisclaimers;
