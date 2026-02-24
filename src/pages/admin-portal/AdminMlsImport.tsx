import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, CheckCircle2, Loader2 } from "lucide-react";
import { useMlsSearch, MlsSearchParams, MlsListing } from "@/hooks/useMlsSearch";
import { useDeals } from "@/hooks/useDeals";
import { createDeal } from "@/lib/screening";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/screening";

const AdminMlsImport = () => {
  const { results, isLoading, error, search } = useMlsSearch();
  const { deals } = useDeals();
  const { toast } = useToast();

  const [searchParams, setSearchParams] = useState<MlsSearchParams>({
    city: "",
    zip: "",
    minPrice: "",
    maxPrice: "",
    minBeds: "",
    maxBeds: "",
    resultsPerPage: "50",
  });

  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const handleSearch = () => {
    // Filter out empty values
    const params: MlsSearchParams = {};
    Object.entries(searchParams).forEach(([key, val]) => {
      if (val && val.trim() !== "") {
        (params as any)[key] = val.trim();
      }
    });
    search(params);
  };

  const handleImport = (listing: MlsListing) => {
    try {
      const deal = createDeal({
        source_type: "MLS",
        mls_listing_id: listing.mls_listing_id,
        address: listing.address,
        city: listing.city,
        state: listing.state,
        zip: listing.zip,
        beds: listing.beds,
        baths: listing.baths,
        sqft: listing.sqft,
        year_built: listing.year_built,
        property_type: listing.property_type,
        list_price: listing.list_price,
        mls_status: listing.mls_status as any,
        photo_urls: listing.photo_urls,
      });

      // For now, log the deal. Full persistence will come with DB integration.
      console.log("Created deal from MLS import:", deal);
      setImportedIds(prev => new Set(prev).add(listing.mls_listing_id));

      toast({
        title: "Deal Imported",
        description: `${listing.address} — Strategy: ${deal.strategy}`,
      });
    } catch (err: any) {
      toast({
        title: "Import Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const isAlreadyImported = (mlsId: string) => {
    return importedIds.has(mlsId) || deals.some(d => d.mls_listing_id === mlsId);
  };

  const updateParam = (key: keyof MlsSearchParams, value: string) => {
    setSearchParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium text-foreground">
          MLS Import
        </h1>
        <p className="text-muted-foreground">
          Search Repliers MLS API and import listings into the Deal Pot
        </p>
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Filters</CardTitle>
          <CardDescription>
            Filter MLS listings by location, price, and property characteristics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="e.g. St Louis" value={searchParams.city} onChange={e => updateParam("city", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input id="zip" placeholder="e.g. 63130" value={searchParams.zip} onChange={e => updateParam("zip", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="minPrice">Min Price</Label>
              <Input id="minPrice" type="number" placeholder="50000" value={searchParams.minPrice} onChange={e => updateParam("minPrice", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="maxPrice">Max Price</Label>
              <Input id="maxPrice" type="number" placeholder="200000" value={searchParams.maxPrice} onChange={e => updateParam("maxPrice", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="minBeds">Min Beds</Label>
              <Input id="minBeds" type="number" placeholder="2" value={searchParams.minBeds} onChange={e => updateParam("minBeds", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="maxBeds">Max Beds</Label>
              <Input id="maxBeds" type="number" placeholder="5" value={searchParams.maxBeds} onChange={e => updateParam("maxBeds", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="minBaths">Min Baths</Label>
              <Input id="minBaths" type="number" placeholder="1" value={searchParams.minBaths} onChange={e => updateParam("minBaths", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="minSqft">Min Sqft</Label>
              <Input id="minSqft" type="number" placeholder="800" value={searchParams.minSqft} onChange={e => updateParam("minSqft", e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search MLS
            </Button>
            {results && (
              <p className="text-sm text-muted-foreground self-center">
                {results.count} results found (page {results.page} of {results.numPages})
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      {results && results.listings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Results</CardTitle>
            <CardDescription>
              Click "Import" to add a listing to the Deal Pot with auto-screening
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>ZIP</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-center">Beds</TableHead>
                    <TableHead className="text-center">Baths</TableHead>
                    <TableHead className="text-right">Sqft</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.listings.map((listing) => {
                    const already = isAlreadyImported(listing.mls_listing_id);
                    return (
                      <TableRow key={listing.mls_listing_id}>
                        <TableCell className="font-medium">{listing.address}</TableCell>
                        <TableCell>{listing.city}</TableCell>
                        <TableCell>{listing.zip}</TableCell>
                        <TableCell className="text-right">{formatCurrency(listing.list_price)}</TableCell>
                        <TableCell className="text-center">{listing.beds}</TableCell>
                        <TableCell className="text-center">{listing.baths}</TableCell>
                        <TableCell className="text-right">{listing.sqft.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={listing.mls_status === "Active" ? "default" : "secondary"}>
                            {listing.mls_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {already ? (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Imported
                            </Badge>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleImport(listing)}>
                              <Download className="w-3 h-3 mr-1" />
                              Import
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {results && results.listings.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No listings found matching your search criteria.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminMlsImport;
