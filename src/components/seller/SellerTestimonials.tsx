import { Quote } from "lucide-react";

const SellerTestimonials = () => {
  const testimonials = [
    {
      quote:
        "They took the time to explain the market and help us price our home strategically. The communication throughout was excellent, and we felt supported at every step.",
      name: "David & Karen W.",
      detail: "Sold in Florissant",
    },
    {
      quote:
        "Professional from start to finish. The marketing was beautiful, and they handled the negotiations skillfully. We couldn't have asked for a better experience.",
      name: "Patricia N.",
      detail: "Sold in University City",
    },
  ];

  return (
    <section className="py-16 px-6 bg-secondary/30">
      <div className="container mx-auto max-w-4xl">
        <h2 className="font-serif text-2xl text-center text-foreground mb-10">
          What Our Sellers Say
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

export default SellerTestimonials;
