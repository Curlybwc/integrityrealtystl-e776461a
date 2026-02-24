import { useState } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMlsSearch, type MlsSearchParams } from "@/hooks/useMlsSearch";
import BatchAnalysisTable from "@/components/portal/BatchAnalysisTable";

const PortalSearchAnalyzer = () => {
  const { results, isLoading, search } = useMlsSearch();

  const [zip, setZip] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("200000");
  const [minBeds, setMinBeds] = useState("2");
  const [minBaths, setMinBaths] = useState("");
  const [status, setStatus] = useState("A");
  const [currentPage, setCurrentPage] = useState(1);

  const buildParams = (page = 1): MlsSearchParams => ({
    zip: zip.trim() || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    minBeds: minBeds || undefined,
    minBaths: minBaths || undefined,
    status,
    resultsPerPage: "50",
    pageNum: String(page),
  });

  const handleSearch = async (page = 1) => {
    setCurrentPage(page);
    await search(buildParams(page));
  };

  const handlePageChange = (page: number) => {
    handleSearch(page);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">
          Search & Analyze
        </h1>
        <p className="text-muted-foreground mt-1">
          Search MLS listings and instantly screen them for Turnkey and BRRRR potential.
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="col-span-2 md:col-span-1">
              <Label htmlFor="zip">ZIP Code(s)</Label>
              <Input
                id="zip"
                placeholder="63110, 63118..."
                value={zip}
                onChange={(e) => setZip(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="minPrice">Min Price</Label>
              <Input
                id="minPrice"
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="maxPrice">Max Price</Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="200000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="minBeds">Min Beds</Label>
              <Input
                id="minBeds"
                type="number"
                placeholder="2"
                value={minBeds}
                onChange={(e) => setMinBeds(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="minBaths">Min Baths</Label>
              <Input
                id="minBaths"
                type="number"
                placeholder="1"
                value={minBaths}
                onChange={(e) => setMinBaths(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Active</SelectItem>
                  <SelectItem value="P">Pending</SelectItem>
                  <SelectItem value="S">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="mt-4"
            onClick={() => handleSearch(1)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Search MLS
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">
              Results ({results.count.toLocaleString()} listings)
            </CardTitle>
            {results.numPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {results.numPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= results.numPages || isLoading}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <BatchAnalysisTable listings={results.listings} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PortalSearchAnalyzer;
