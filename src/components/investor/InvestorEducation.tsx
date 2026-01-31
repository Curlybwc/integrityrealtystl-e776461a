import { PlayCircle, BookOpen, AlertTriangle, MapPin } from "lucide-react";

const InvestorEducation = () => {
  const topics = [
    {
      icon: BookOpen,
      title: "How Integrity Evaluates Deals",
      description:
        "Learn our criteria for property selection, including condition assessment, neighborhood analysis, and financial modeling.",
      type: "Article",
    },
    {
      icon: PlayCircle,
      title: "Understanding Rent-to-Price Ratios",
      description:
        "A practical explanation of this key metric, what it tells you, and why it's just one factor among many.",
      type: "Video",
    },
    {
      icon: AlertTriangle,
      title: "Risks in Older Housing Stock",
      description:
        "Common challenges with pre-1970s homes in St. Louis: foundation issues, galvanized plumbing, electrical updates, and more.",
      type: "Article",
    },
    {
      icon: MapPin,
      title: "Why North County St. Louis?",
      description:
        "The economic and demographic factors that make this area attractive for long-term rental investment.",
      type: "Video",
    },
  ];

  return (
    <section className="py-16 px-6 bg-background">
      <div className="container mx-auto max-w-5xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          Investor Education
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          We believe educated investors make better partners. These resources introduce 
          our thinking—with more in-depth content available inside the Investor Portal.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {topics.map((topic, index) => {
            const Icon = topic.icon;
            return (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-6 shadow-card group hover:shadow-card-hover transition-shadow duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded">
                    {topic.type}
                  </span>
                </div>
                <h3 className="font-serif text-lg text-foreground mb-2">
                  {topic.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {topic.description}
                </p>
                <p className="text-xs text-primary mt-4 font-medium">
                  Coming Soon
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          This content is educational, not promotional. We aim to prepare you for informed 
          decision-making—not to sell you on anything.
        </p>
      </div>
    </section>
  );
};

export default InvestorEducation;
