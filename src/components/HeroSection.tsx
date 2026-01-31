import logo from "@/assets/integrity-logo.png";

const HeroSection = () => {
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="container mx-auto text-center max-w-4xl">
        <img 
          src={logo} 
          alt="Integrity Realty STL" 
          className="h-32 md:h-40 w-auto mx-auto mb-8 animate-fade-up opacity-0"
        />
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 animate-fade-up opacity-0 animation-delay-200">
          Real Estate, Done with Integrity
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-up opacity-0 animation-delay-400">
          Whether you're investing, buying, selling, or sourcing deals—choose the path that fits your goal.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
