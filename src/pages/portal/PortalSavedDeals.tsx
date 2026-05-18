import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Filter,
  Search,
  Bed,
  Bath,
  MapPin,
  ArrowLeft,
  Heart,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSavedDeals } from "@/hooks/useSavedDeals";
import { formatCurrency, formatPercent } from "@/lib/screening";

const PortalSavedDeals = () => {
  const { list, loading } = useSavedDeals();
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [sort, setSort] = useState("saved_desc");

  const filtered = useMemo(() => {
    let rows = list.filter((d) => {
      const q = query.toLowerCase();
      const matchesQ =
        !q ||
        d.address.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.zip.includes(query);
      const matchesTag = tagFilter === "all" || d.source_tags.includes(tagFilter);
      return matchesQ && matchesTag;
    });
    rows = [...rows].sort((a, b) => {
      switch (sort) {
        case "saved_asc":
          return a.saved_at.localeCompare(b.saved_at);
        case "price_asc":
          return (a.list_price_at_save ?? 0) - (b.list_price_at_save ?? 0);
        case "price_desc":
          return (b.list_price_at_save ?? 0) - (a.list_price_at_save ?? 0);
        case "address":
          return a.address.localeCompare(b.address);
        case "saved_desc":
        default:
          return b.saved_at.localeCompare(a.saved_at);
      }
    });
    return rows;
  }, [list, query, tagFilter, sort]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading saved deals…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/portal/investor/deals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-2xl text-foreground mb-1 flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary fill-current" />
            My Saved Deals
          </h1>
          <p className="text-muted-foreground text-sm">
            Your private underwriting snapshots. Saved values survive MLS, photo, and pricing changes.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filters</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search address, city, ZIP…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="MLS Deal">MLS Deal</SelectItem>
              <SelectItem value="Wholesale Deal">Wholesale Deal</SelectItem>
              <SelectItem value="Deal Alert">Deal Alert</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="saved_desc">Recently saved</SelectItem>
              <SelectItem value="saved_asc">Oldest saved</SelectItem>
              <SelectItem value="price_asc">Price: low to high</SelectItem>
              <SelectItem value="price_desc">Price: high to low</SelectItem>
              <SelectItem value="address">Address A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {list.length} saved deals
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((d) => {
          const photo = d.photo_urls?.[0];
          const isWholesale = d.source_tags.includes("Wholesale Deal");
          return (
            <Link key={d.id} to={`/portal/investor/deals/saved/${d.id}`} className="group">
              <div className="bg-card border border-border rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  {photo ? (
                    <img
                      src={photo}
                      alt={d.address}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {isWholesale ? (
                        <Store className="w-12 h-12 text-muted-foreground/30" />
                      ) : (
                        <Building2 className="w-12 h-12 text-muted-foreground/30" />
                      )}
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                    {d.source_tags.map((t) => (
                      <Badge key={t} variant="outline" className="bg-background/80 text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="text-xs">
                      <Heart className="w-3 h-3 fill-current mr-1" /> Saved
                    </Badge>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {d.address}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {d.city}, {d.zip}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2 mb-3">
                    {d.beds != null && (
                      <span className="flex items-center gap-1">
                        <Bed className="w-3 h-3" />
                        {d.beds} bed
                      </span>
                    )}
                    {d.baths != null && (
                      <span className="flex items-center gap-1">
                        <Bath className="w-3 h-3" />
                        {d.baths} bath
                      </span>
                    )}
                    {d.sqft != null && <span>{d.sqft.toLocaleString()} sqft</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border mb-3">
                    <div className="bg-accent/50 rounded px-2 py-1.5 text-center">
                      <p className="text-xs text-muted-foreground">Rent / All-In</p>
                      <p className={`text-sm font-semibold ${d.underwriting.rent_to_price_pct >= 0.0135 ? "text-green-600" : "text-foreground"}`}>
                        {formatPercent(d.underwriting.rent_to_price_pct)}
                      </p>
                    </div>
                    <div className="bg-accent/50 rounded px-2 py-1.5 text-center">
                      <p className="text-xs text-muted-foreground">All-In % ARV</p>
                      <p className={`text-sm font-semibold ${d.underwriting.all_in_pct_of_arv > 0 && d.underwriting.all_in_pct_of_arv <= 0.75 ? "text-green-600" : "text-foreground"}`}>
                        {formatPercent(d.underwriting.all_in_pct_of_arv)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">List @ save</p>
                      <p className="font-serif text-lg font-medium text-foreground">
                        {d.list_price_at_save != null ? formatCurrency(d.list_price_at_save) : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Saved</p>
                      <p className="text-xs text-foreground">{new Date(d.saved_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {list.length === 0
              ? "No saved deals yet — open a deal and click Save Deal."
              : "No saved deals match your filters."}
          </p>
        </div>
      )}
    </div>
  );
};

export default PortalSavedDeals;
