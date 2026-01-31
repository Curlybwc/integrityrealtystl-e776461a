import { Quote } from "lucide-react";

const BuyerTestimonials = () => {
  const testimonials = [
    {
      quote:
        "As first-time homebuyers, we had so many questions. The team was patient, explained everything clearly, and never made us feel rushed. We found a home we love.",
      name: "Jessica & Marcus D.",
      detail: "First-time homebuyers",
    },
    {
      quote:
        "After relocating from out of state, I needed someone who really knew the area. They helped me understand different neighborhoods and find the perfect fit for my family.",
      name: "Amanda L.",
      detail: "Relocation buyer",
    },
  ];

  return (
    <section className="py-16 px-6 bg-secondary/30">
      <div className="container mx-auto max-w-4xl">
        <h2 className="font-serif text-2xl text-center text-foreground mb-10">
          What Our Buyers Say
        </h2>

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
      </div>
    </section>
  );
};

export default BuyerTestimonials;
