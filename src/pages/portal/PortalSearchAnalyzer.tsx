import { useState } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight, Settings2, Info } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useMlsSearch, type MlsSearchParams } from "@/hooks/useMlsSearch";
import { DEFAULT_SCREENING_CONFIG, type ScreeningConfig } from "@/lib/screening";
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
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Screening config state
  const [screeningConfig, setScreeningConfig] = useState<ScreeningConfig>({
    ...DEFAULT_SCREENING_CONFIG,
  });

  const updateConfig = (key: keyof ScreeningConfig, value: number) => {
    setScreeningConfig((prev) => ({ ...prev, [key]: value }));
  };

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

      {/* Disclaimer */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Screening assumptions:</strong> Rent estimates are based on ZIP-level comps and Fair Market Rent data. 
          ARV is estimated from median $/sqft by ZIP. Repair costs are assigned by property age (Light ≤20yr, Medium 21–50yr, Heavy 50yr+). 
          All-in % = (Purchase Price + Estimated Repairs) ÷ ARV. These are <em>estimates only</em> — always verify with your own due diligence. 
          Adjust the screening thresholds below to match your criteria.
        </AlertDescription>
      </Alert>

      {/* Screening Settings */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Screening Settings
            <span className="text-xs text-muted-foreground">
              {settingsOpen ? "(collapse)" : "(customize thresholds)"}
            </span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BRRRR Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-foreground">BRRRR Strategy</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Min Rent-to-Price %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={(screeningConfig.brrrr_min_rtp * 100).toFixed(2)}
                        onChange={(e) => updateConfig("brrrr_min_rtp", parseFloat(e.target.value) / 100 || 0)}
                        className="h-8 text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground mt-0.5">Monthly rent ÷ purchase price (default: 1.30%)</p>
                    </div>
                    <div>
                      <Label className="text-xs">Max All-in % of ARV</Label>
                      <Input
                        type="number"
                        step="1"
                        value={(screeningConfig.brrrr_max_all_in_pct * 100).toFixed(0)}
                        onChange={(e) => updateConfig("brrrr_max_all_in_pct", parseFloat(e.target.value) / 100 || 0)}
                        className="h-8 text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground mt-0.5">(Price + Repairs) ÷ ARV must be ≤ this (default: 75%)</p>
                    </div>
                  </div>
                </div>

                {/* Turnkey Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-foreground">Turnkey Strategy</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Min Rent-to-Price %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={(screeningConfig.turnkey_min_rtp * 100).toFixed(2)}
                        onChange={(e) => updateConfig("turnkey_min_rtp", parseFloat(e.target.value) / 100 || 0)}
                        className="h-8 text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground mt-0.5">Monthly rent ÷ purchase price (default: 1.35%)</p>
                    </div>
                    <div>
                      <Label className="text-xs">Price as % of ARV (range)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="1"
                          value={(screeningConfig.turnkey_min_arv_pct * 100).toFixed(0)}
                          onChange={(e) => updateConfig("turnkey_min_arv_pct", parseFloat(e.target.value) / 100 || 0)}
                          className="h-8 text-sm"
                          placeholder="Min %"
                        />
                        <Input
                          type="number"
                          step="1"
                          value={(screeningConfig.turnkey_max_arv_pct * 100).toFixed(0)}
                          onChange={(e) => updateConfig("turnkey_max_arv_pct", parseFloat(e.target.value) / 100 || 0)}
                          className="h-8 text-sm"
                          placeholder="Max %"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Purchase price must be within this ARV range (default: 80–100%)</p>
                    </div>
                  </div>
                </div>

                {/* Repair Cost Settings */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="font-semibold text-sm text-foreground">Repair Cost Estimates ($/sqft)</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs">Turnkey ($5/sf)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={screeningConfig.rehab_rate_turnkey}
                        onChange={(e) => updateConfig("rehab_rate_turnkey", parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Light ($15/sf)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={screeningConfig.rehab_rate_light}
                        onChange={(e) => updateConfig("rehab_rate_light", parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Medium ($30/sf)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={screeningConfig.rehab_rate_medium}
                        onChange={(e) => updateConfig("rehab_rate_medium", parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Heavy ($50/sf)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={screeningConfig.rehab_rate_heavy}
                        onChange={(e) => updateConfig("rehab_rate_heavy", parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Default rehab tier is Light for all properties. Change per-listing in the Deal Analyzer.</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="mt-4 text-xs"
                onClick={() => setScreeningConfig({ ...DEFAULT_SCREENING_CONFIG })}
              >
                Reset to Defaults
              </Button>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

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
            <BatchAnalysisTable
              listings={results.listings}
              screeningConfig={screeningConfig}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PortalSearchAnalyzer;
