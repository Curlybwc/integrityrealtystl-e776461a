import { Quote } from "lucide-react";

const InvestorTestimonials = () => {
  const testimonials = [
    {
      quote:
        "What I appreciate most is the transparency. They explained the risks upfront and helped me understand exactly what I was getting into. No pressure, just honest guidance.",
      name: "Michael R.",
      detail: "Investor since 2022",
    },
    {
      quote:
        "The team's communication throughout the process was exceptional. They answered every question and never made me feel rushed to make a decision.",
      name: "Sarah T.",
      detail: "Out-of-state investor",
    },
  ];

  return (
    <section className="py-16 px-6 bg-background">
      <div className="container mx-auto max-w-4xl">
        <h2 className="font-serif text-2xl text-center text-foreground mb-4">
          What Investors Say
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-10 max-w-xl mx-auto">
          These testimonials reflect individual experiences with our communication 
          and process—not investment outcomes.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-6 shadow-card relative"
            >
              <Quote className="w-8 h-8 text-primary/20 absolute top-4 right-4" />
              <p className="text-muted-foreground text-sm leading-relaxed mb-4 pr-8">
                "{testimonial.quote}"
              </p>
              <div>
                <p className="font-medium text-foreground text-sm">
                  {testimonial.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {testimonial.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 max-w-lg mx-auto italic">
          Individual investor experiences vary. Testimonials do not guarantee similar 
          outcomes. Investment performance is not implied or promised.
        </p>
      </div>
    </section>
  );
};

export default InvestorTestimonials;
