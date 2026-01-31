import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface AudienceCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  delay?: string;
}

const AudienceCard = ({ title, description, href, icon: Icon, delay = "" }: AudienceCardProps) => {
  return (
    <Link
      to={href}
      className={`group block bg-card rounded-lg border border-border p-8 shadow-card hover:shadow-card-hover hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 animate-fade-up opacity-0 ${delay}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
          <Icon className="w-5 h-5 text-accent-foreground group-hover:text-primary-foreground transition-colors duration-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-serif text-xl text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default AudienceCard;
