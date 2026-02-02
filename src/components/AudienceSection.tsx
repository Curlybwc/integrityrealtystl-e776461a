import { TrendingUp, Home, Tag, Zap, Handshake, Wrench } from "lucide-react";
import AudienceCard from "./AudienceCard";

const audiences = [
  {
    title: "Invest with Integrity",
    description: "Long-term rental investing and curated opportunities for building lasting wealth through real estate.",
    href: "/invest",
    icon: TrendingUp,
    delay: "animation-delay-100",
  },
  {
    title: "Find Your Next Home",
    description: "Expert guidance for buyers purchasing a primary residence in the St. Louis area.",
    href: "/buyers",
    icon: Home,
    delay: "animation-delay-200",
  },
  {
    title: "List Your Property",
    description: "Professional representation for homeowners and investors ready to sell.",
    href: "/sellers",
    icon: Tag,
    delay: "animation-delay-300",
  },
  {
    title: "Sell Your House As-Is for Cash",
    description: "A fast, no-repairs option for distressed situations or quick closings.",
    href: "/sellfast",
    icon: Zap,
    delay: "animation-delay-400",
  },
  {
    title: "Submit a Wholesale Deal",
    description: "Share off-market opportunities with our team and build a profitable partnership.",
    href: "/wholesalers",
    icon: Handshake,
    delay: "animation-delay-500",
  },
  {
    title: "Apply to be a Network Partner",
    description: "Contractors and service providers: join our trusted network and connect with investors.",
    href: "/network-partner",
    icon: Wrench,
    delay: "animation-delay-600",
  },
];

const AudienceSection = () => {
  return (
    <section className="py-16 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="grid gap-4">
          {audiences.map((audience) => (
            <AudienceCard key={audience.href} {...audience} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;
