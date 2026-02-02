import { ExternalLink, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UsefulLink {
  title: string;
  url: string;
  description: string;
  category: string;
}

// User-provided useful links
const usefulLinks: UsefulLink[] = [
  {
    title: "Rentometer - Rent Comps",
    url: "https://www.rentometer.com",
    description: "Research rental rates and comps in your target area",
    category: "Market Research",
  },
  {
    title: "SpotCrime - Check Crime in Area",
    url: "https://www.spotcrime.com",
    description: "View crime data and safety information by neighborhood",
    category: "Market Research",
  },
  {
    title: "ZIP Code Map",
    url: "https://www.unitedstateszipcodes.org/63135/",
    description: "Explore ZIP code boundaries and demographics",
    category: "Market Research",
  },
  {
    title: "St. Louis County Property Assessor",
    url: "https://revenue.stlouisco.com/IAS/SearchInput.aspx",
    description: "Property tax records, assessed values, and ownership info for St. Louis County",
    category: "Property Research",
  },
  {
    title: "St. Louis City Property Assessor",
    url: "https://www.stlouis-mo.gov/data/address-search/index.cfm",
    description: "Property assessment records for City of St. Louis",
    category: "Property Research",
  },
  {
    title: "FEMA Flood Map",
    url: "https://msc.fema.gov/portal/search",
    description: "Check if a property is in a flood plain",
    category: "Property Research",
  },
  {
    title: "SLHA Utility Allowance for 2025",
    url: "https://www.slha.org/wp-content/uploads/2025/01/Allowances-for-2025.pdf",
    description: "Official St. Louis Housing Authority utility allowance schedule",
    category: "Section 8 / HUD",
  },
  {
    title: "Mike Finney - Shelter Insurance",
    url: "https://www.shelterinsurance.com/CA/agent/mikefinney",
    description: "Recommended insurance agent for investment properties",
    category: "Service Providers",
  },
  {
    title: "Ameren Missouri",
    url: "https://www.ameren.com/missouri",
    description: "Electric utility provider for the St. Louis region",
    category: "Utilities",
  },
  {
    title: "Spire Energy",
    url: "https://www.spireenergy.com/",
    description: "Natural gas utility provider",
    category: "Utilities",
  },
  {
    title: "MSD Project Clear",
    url: "https://msdprojectclear.org/",
    description: "Metropolitan St. Louis Sewer District - sewer services",
    category: "Utilities",
  },
  {
    title: "American Water",
    url: "https://login.amwater.com/",
    description: "Water utility provider",
    category: "Utilities",
  },
  {
    title: "Waste Connections - St. Louis",
    url: "https://www.wasteconnections.com/st-louis/",
    description: "Trash and recycling services",
    category: "Utilities",
  },
  {
    title: "Republic Services",
    url: "https://www.republicservices.com/residents",
    description: "Residential trash and recycling services",
    category: "Utilities",
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