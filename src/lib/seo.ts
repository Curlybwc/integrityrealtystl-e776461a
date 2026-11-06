// Per-route SEO metadata for the public site.
//
// Drafted 2026-11-06 from each page's own headline and content (SEO fix
// bundle). Titles/descriptions are copy — Jen flips them before publish.
// The global fallback in index.html only ever describes the home page;
// every public route below carries its own title, description, canonical
// and Open Graph values, applied by SeoManager on navigation.

export const SITE_URL = "https://integrityrealtystl.com";
export const SITE_NAME = "Integrity Realty STL";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/icon-512.png`;

export interface RouteSeo {
  title: string;
  description: string;
  /** Path used for the canonical URL and og:url. */
  path: string;
}

export const PUBLIC_SEO: Record<string, RouteSeo> = {
  "/": {
    title: "Integrity Realty STL | Real Estate Done with Integrity",
    description:
      "Whether you're investing, buying, selling, or sourcing deals—Integrity Realty STL provides honest, transparent real estate services in St. Louis.",
    path: "/",
  },
  "/invest": {
    title: "Invest with Integrity | Integrity Realty STL",
    description:
      "Off-market and MLS deals, honest numbers, and a local team on the ground. See how Integrity Realty STL helps investors buy with confidence in St. Louis.",
    path: "/invest",
  },
  "/buyers": {
    title: "Find Your Next Home | Integrity Realty STL",
    description:
      "Tell us what you're looking for and we'll help you find your next home in the St. Louis area—with honest guidance from search to closing.",
    path: "/buyers",
  },
  "/sellers": {
    title: "List Your Property with Confidence | Integrity Realty STL",
    description:
      "Full MLS exposure. Local expertise. Professional representation. List your St. Louis property with a team that does what it says.",
    path: "/sellers",
  },
  "/sellfast": {
    title: "Sell Your House Fast | Integrity Realty STL",
    description:
      "Need to sell quickly? Get honest information about your options—no pressure, no obligations, just a straight conversation about your St. Louis property.",
    path: "/sellfast",
  },
  "/wholesalers": {
    title: "Wholesalers | Integrity Realty STL",
    description:
      "Approved wholesalers can share deals with Integrity Realty STL and our investor network. Apply to become an approved wholesaler in the St. Louis market.",
    path: "/wholesalers",
  },
  "/about": {
    title: "About Integrity Realty STL",
    description:
      "We do what we say and say what we mean. Meet the St. Louis brokerage built on honest guidance, invested in the neighborhoods we serve.",
    path: "/about",
  },
  "/contact": {
    title: "Get in Touch | Integrity Realty STL",
    description:
      "Contact Integrity Realty STL—reach Jen, Michele, or Samantha about investing, buying, or selling real estate in the St. Louis area.",
    path: "/contact",
  },
  "/network-partner": {
    title: "Become a Network Partner | Integrity Realty STL",
    description:
      "Join the Integrity Realty STL network of local professionals serving St. Louis investors and homeowners. Apply to become a network partner.",
    path: "/network-partner",
  },
  "/privacy-policy": {
    title: "Privacy Policy | Integrity Realty STL",
    description:
      "How Integrity Realty STL collects, uses, and protects your information.",
    path: "/privacy-policy",
  },
  "/terms": {
    title: "Terms of Service | Integrity Realty STL",
    description:
      "The terms that govern use of the Integrity Realty STL website and services.",
    path: "/terms",
  },
};

/** Title-only entries for app/auth surfaces (also marked noindex). */
const APP_TITLES: Array<[prefix: string, title: string]> = [
  ["/portal/investor", "Investor Portal | Integrity Realty STL"],
  ["/portal/wholesaler", "Wholesaler Portal | Integrity Realty STL"],
  ["/portal/partner", "Partner Portal | Integrity Realty STL"],
  ["/portal/admin", "Admin | Integrity Realty STL"],
  ["/portal", "Portal | Integrity Realty STL"],
  ["/admin", "Admin | Integrity Realty STL"],
  ["/login", "Sign In | Integrity Realty STL"],
  ["/investor-login", "Investor Sign In | Integrity Realty STL"],
  ["/wholesaler-login", "Wholesaler Sign In | Integrity Realty STL"],
  ["/partner-login", "Partner Sign In | Integrity Realty STL"],
  ["/admin-login", "Admin Sign In | Integrity Realty STL"],
  ["/signup", "Create Account | Integrity Realty STL"],
  ["/forgot-password", "Reset Password | Integrity Realty STL"],
  ["/reset-password", "Reset Password | Integrity Realty STL"],
  ["/portals", "Portals | Integrity Realty STL"],
];

export interface ResolvedSeo {
  title: string;
  description?: string;
  canonical?: string;
  indexable: boolean;
}

export function resolveSeo(pathname: string): ResolvedSeo {
  const pub = PUBLIC_SEO[pathname];
  if (pub) {
    return {
      title: pub.title,
      description: pub.description,
      canonical: `${SITE_URL}${pub.path}`,
      indexable: true,
    };
  }
  if (pathname.startsWith("/listing/")) {
    return {
      title: "Property Listing | Integrity Realty STL",
      canonical: `${SITE_URL}${pathname}`,
      indexable: true,
    };
  }
  for (const [prefix, title] of APP_TITLES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return { title, indexable: false };
    }
  }
  return { title: "Page Not Found | Integrity Realty STL", indexable: false };
}
