import Layout from "@/components/Layout";

const About = () => {
  return (
    <Layout>
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6 text-center">
            About Integrity Realty STL
          </h1>
          
          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="text-lg leading-relaxed mb-6">
              At Integrity Realty STL, we believe that real estate transactions should be built on a foundation of trust, 
              transparency, and genuine care for our clients. Based in St. Louis, Missouri, we serve a diverse range of 
              clients—from first-time homebuyers to seasoned investors.
            </p>
            
            <h2 className="font-serif text-2xl text-foreground mt-12 mb-4">Our Mission</h2>
            <p className="leading-relaxed mb-6">
              To provide honest, client-centered real estate services that help individuals and families build wealth, 
              find their dream homes, and make informed property decisions with confidence.
            </p>
            
            <h2 className="font-serif text-2xl text-foreground mt-12 mb-4">Our Values</h2>
            <ul className="space-y-3 mb-6">
              <li><strong className="text-foreground">Integrity:</strong> We do what we say and say what we mean.</li>
              <li><strong className="text-foreground">Transparency:</strong> No hidden agendas, just honest guidance.</li>
              <li><strong className="text-foreground">Excellence:</strong> We strive for the best outcomes for every client.</li>
              <li><strong className="text-foreground">Community:</strong> We're invested in the St. Louis neighborhoods we serve.</li>
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
