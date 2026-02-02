import { ExternalLink, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UsefulLink {
  title: string;
  url: string;
  description: string;
  category: string;
}

// Placeholder links - user will provide actual links
const usefulLinks: UsefulLink[] = [
  {
    title: "HUD Fair Market Rents",
    url: "https://www.huduser.gov/portal/datasets/fmr.html",
    description: "Official HUD Fair Market Rent data and documentation",
    category: "Section 8 / HUD",
  },
  {
    title: "St. Louis County Assessor",
    url: "https://revenue.stlouisco.com/IAS/",
    description: "Property tax records, assessed values, and ownership info",
    category: "Property Research",
  },
  {
    title: "St. Louis City Assessor",
    url: "https://www.stlouis-mo.gov/government/departments/assessor/",
    description: "City of St. Louis property assessment records",
    category: "Property Research",
  },
  {
    title: "Missouri Case.net",
    url: "https://www.courts.mo.gov/cnet/",
    description: "Court records including eviction history",
    category: "Property Research",
  },
  {
    title: "St. Louis County GIS",
    url: "https://stlouiscountymo.gov/st-louis-county-departments/revenue/geographic-information-system-gis/",
    description: "Maps, parcel data, and geographic information",
    category: "Property Research",
  },
];

const PortalLinks = () => {
  // Group links by category
  const categories = [...new Set(usefulLinks.map((link) => link.category))];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">
          Useful Links
        </h1>
        <p className="text-muted-foreground text-sm">
          External resources for property research, Section 8, and investing.
        </p>
      </div>

      {/* Links by Category */}
      {categories.map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LinkIcon className="w-5 h-5 text-primary" />
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usefulLinks
                .filter((link) => link.category === category)
                .map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground mt-0.5 group-hover:text-primary transition-colors" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {link.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {link.description}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1 truncate">
                        {link.url}
                      </p>
                    </div>
                  </a>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add Link Request */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          Have a useful resource to suggest? Let us know and we may add it to the directory.
        </p>
      </div>
    </div>
  );
};

export default PortalLinks;