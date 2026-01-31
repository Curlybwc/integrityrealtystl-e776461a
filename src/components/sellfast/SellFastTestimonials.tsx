import { Quote } from "lucide-react";

const SellFastTestimonials = () => {
  const testimonials = [
    {
      quote:
        "I appreciated that they explained all my options upfront, including listing on the MLS. They never made me feel rushed or pressured. The communication throughout was clear and respectful.",
      name: "Robert M.",
      detail: "Inherited property seller",
    },
    {
      quote:
        "Going through a difficult time, I needed simplicity more than anything. They were honest about the trade-offs and made sure I understood everything before moving forward.",
      name: "Linda K.",
      detail: "Relocation seller",
    },
  ];

  return (
    <section className="py-16 px-6 bg-background">
      <div className="container mx-auto max-w-4xl">
        <h2 className="font-serif text-2xl text-center text-foreground mb-4">
          What Sellers Say About the Process
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-10 max-w-xl mx-auto">
          These testimonials focus on communication and transparency—not price or speed outcomes.
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
          Individual experiences vary. Testimonials reflect personal experiences with our 
          communication and process and do not guarantee similar outcomes.
        </p>
      </div>
    </section>
  );
};

export default SellFastTestimonials;
