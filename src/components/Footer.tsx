import { Link } from "react-router-dom";
import logo from "@/assets/integrity-logo.png";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo & Brand */}
          <div className="space-y-4">
            <img 
              src={logo} 
              alt="Integrity Realty STL" 
              className="h-16 w-auto brightness-0 invert opacity-90"
            />
            <p className="text-primary-foreground/80 text-sm leading-relaxed max-w-xs">
              Building lasting relationships through honest, transparent real estate practices in the St. Louis area.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-serif text-lg">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link 
                to="/about" 
                className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                About Us
              </Link>
              <Link 
                to="/contact" 
                className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Contact
              </Link>
              <Link 
                to="/login" 
                className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Investor Portal
              </Link>
              <Link 
                to="/wholesaler-login" 
                className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Wholesaler Portal
              </Link>
              <Link 
                to="/partner-login" 
                className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Partner Portal
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-serif text-lg">Contact</h4>
            <div className="space-y-2 text-sm text-primary-foreground/80">
              <p>St. Louis, Missouri</p>
              <p>jen@integrityrealtystl.com</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-primary-foreground/60">
              © {new Date().getFullYear()} Integrity Realty STL. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link 
                to="/privacy" 
                className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms" 
                className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
          <p className="mt-4 text-xs text-primary-foreground/40 text-center md:text-left">
            Integrity Realty STL is a licensed real estate brokerage in Missouri. Equal Housing Opportunity.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
