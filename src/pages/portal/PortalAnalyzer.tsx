import { Calculator, FileSpreadsheet, PieChart, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const PortalAnalyzer = () => {
  const tools = [
    {
      icon: Calculator,
      title: "Rental Property Calculator",
      description:
        "Estimate cash flow, cash-on-cash return, and cap rate for potential investments.",
      status: "Coming Soon",
    },
    {
      icon: FileSpreadsheet,
      title: "BRRR Analyzer",
      description:
        "Model the Buy, Rehab, Rent, Refinance, Repeat strategy to see how capital can be recycled.",
      status: "Coming Soon",
    },
    {
      icon: PieChart,
      title: "Deal Comparison Tool",
      description:
        "Compare multiple properties side-by-side to evaluate which opportunity best fits your criteria.",
      status: "Coming Soon",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">
          Analyzer Tools
        </h1>
        <p className="text-muted-foreground text-sm">
          Use these tools to evaluate potential investments. Remember: all outputs 
          are estimates for informational purposes only.
        </p>
      </div>

      {/* Warning */}
      <div className="bg-accent/50 border border-border rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Important Disclaimer</p>
          <p className="text-sm text-muted-foreground">
            These tools are provided for informational and educational purposes only. 
            Results do not constitute investment advice, recommendations, or pass/fail 
            determinations. All inputs and outputs should be independently verified.
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-6 shadow-card"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-lg text-foreground mb-2">
                {tool.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {tool.description}
              </p>
              <Button variant="outline" disabled className="w-full">
                {tool.status}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Placeholder for future calculator */}
      <div className="bg-card border border-border rounded-lg p-8 shadow-card text-center">
        <Calculator className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-serif text-lg text-foreground mb-2">
          Analysis Tools Coming Soon
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          We're building tools to help you evaluate deals more efficiently. 
          In the meantime, contact us for personalized analysis assistance.
        </p>
      </div>
    </div>
  );
};

export default PortalAnalyzer;
