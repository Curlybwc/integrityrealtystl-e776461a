const AboutSection = () => {
  return (
    <section className="py-20 px-6 bg-secondary/50">
      <div className="container mx-auto max-w-3xl text-center">
        <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">
          About Integrity Realty STL
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          We believe real estate should be built on trust, transparency, and genuine care for our clients. 
          Whether you're a first-time homebuyer, seasoned investor, or property owner exploring your options, 
          we're here to guide you with honesty and expertise every step of the way.
        </p>
        <div className="flex flex-wrap justify-center gap-12 mt-12">
          <div className="text-center">
            <p className="font-serif text-3xl text-primary">100+</p>
            <p className="text-sm text-muted-foreground mt-1">Transactions</p>
          </div>
          <div className="text-center">
            <p className="font-serif text-3xl text-primary">St. Louis</p>
            <p className="text-sm text-muted-foreground mt-1">Market Focus</p>
          </div>
          <div className="text-center">
            <p className="font-serif text-3xl text-primary">5★</p>
            <p className="text-sm text-muted-foreground mt-1">Client Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
