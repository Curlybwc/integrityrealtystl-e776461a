import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Calculator, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RepairPreset,
  REPAIR_PRESET_LABELS,
  getRepairEstimate,
  calculateArvQuick,
  getFmr,
  getRentComp,
  getSupportedZips,
} from "@/data/stlZipData";

interface DealInputs {
  address: string;
  city: string;
  zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  currentRent: number;
  avgRent: number;
  isAvgRentManual: boolean;
  repairPreset: RepairPreset;
  manualRepairs: number;
  manualArv: number;
}

const initialInputs: DealInputs = {
  address: "",
  city: "",
  zip: "",
  price: 0,
  beds: 3,
  baths: 1,
  sqft: 0,
  currentRent: 0,
  avgRent: 0,
  isAvgRentManual: false,
  repairPreset: "medium",
  manualRepairs: 0,
  manualArv: 0,
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number): string => {
  if (!isFinite(value)) return "—";
  return `${(value * 100).toFixed(2)}%`;
};

const InfoTooltip = ({ content }: { content: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help inline ml-1" />
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <p className="text-xs">{content}</p>
    </TooltipContent>
  </Tooltip>
);

const ResultRow = ({
  label,
  value,
  tooltip,
  highlight,
}: {
  label: string;
  value: string;
  tooltip?: string;
  highlight?: boolean;
}) => (
  <div
    className={`flex justify-between items-center py-2 px-3 rounded ${
      highlight ? "bg-primary/10" : ""
    }`}
  >
    <span className="text-sm text-muted-foreground flex items-center">
      {label}
      {tooltip && <InfoTooltip content={tooltip} />}
    </span>
    <span
      className={`font-mono text-sm ${
        highlight ? "font-semibold text-primary" : "text-foreground"
      }`}
    >
      {value}
    </span>
  </div>
);

const DealAnalyzer = () => {
  const [searchParams] = useSearchParams();
  const [inputs, setInputs] = useState<DealInputs>(initialInputs);
  const supportedZips = getSupportedZips();

  // Auto-populate from URL params
  useEffect(() => {
    const address = searchParams.get("address");
    const city = searchParams.get("city");
    const zip = searchParams.get("zip");
    const beds = searchParams.get("beds");
    const baths = searchParams.get("baths");
    const sqft = searchParams.get("sqft");
    const price = searchParams.get("price");
    const rent = searchParams.get("rent");
    const arv = searchParams.get("arv");

    if (address || city || zip || beds || sqft || price) {
      const parsedZip = zip || "";
      const parsedBeds = beds ? Number(beds) : 3;
      const rentComp = getRentComp(parsedZip, parsedBeds);
      
      setInputs((prev) => ({
        ...prev,
        address: address || prev.address,
        city: city || prev.city,
        zip: parsedZip,
        beds: parsedBeds,
        baths: baths ? Number(baths) : prev.baths,
        sqft: sqft ? Number(sqft) : prev.sqft,
        price: price ? Number(price) : prev.price,
        avgRent: rent ? Number(rent) : (rentComp || prev.avgRent),
        isAvgRentManual: !!rent,
        manualArv: arv ? Number(arv) : prev.manualArv,
      }));
    }
  }, [searchParams]);

  const updateInput = <K extends keyof DealInputs>(
    key: K,
    value: DealInputs[K]
  ) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };
  
  // Handle ZIP change - always update avgRent unless manually set
  const handleZipChange = (zip: string) => {
    setInputs((prev) => {
      const rentComp = getRentComp(zip, prev.beds);
      return {
        ...prev,
        zip,
        avgRent: !prev.isAvgRentManual && rentComp ? rentComp : prev.avgRent,
      };
    });
  };
  
  // Handle beds change - always update avgRent unless manually set
  const handleBedsChange = (beds: number) => {
    setInputs((prev) => {
      const rentComp = getRentComp(prev.zip, beds);
      return {
        ...prev,
        beds,
        avgRent: !prev.isAvgRentManual && rentComp ? rentComp : prev.avgRent,
      };
    });
  };
  
  // Handle manual avgRent entry
  const handleAvgRentChange = (value: number) => {
    setInputs((prev) => {
      const rentComp = getRentComp(prev.zip, prev.beds);
      // If user clears the field or sets it back to the zip average, revert to auto mode
      if (value === 0 || value === rentComp) {
        return { ...prev, avgRent: rentComp || 0, isAvgRentManual: false };
      }
      return { ...prev, avgRent: value, isAvgRentManual: true };
    });
  };

  // Calculated values
  const calculations = useMemo(() => {
    const { zip, price, beds, sqft, currentRent, avgRent, repairPreset, manualRepairs, manualArv } = inputs;

    // Repair estimate (manual overrides preset)
    const repairEstimate = manualRepairs > 0 
      ? manualRepairs 
      : getRepairEstimate(sqft, repairPreset);

    // ARV (manual overrides auto)
    const arvQuick = calculateArvQuick(zip, sqft);
    const arv = manualArv > 0 ? manualArv : (arvQuick ?? 0);

    // All-in estimate
    const allIn = price + repairEstimate;

    // 75% ARV Offer (BRRR formula)
    const offer75 = arv > 0 ? arv * 0.75 - repairEstimate : 0;

    // % of ARV
    const percentArv = arv > 0 ? price / arv : 0;

    // Rent-to-Price ratios (monthly rent / price)
    const currentRtp = price > 0 ? currentRent / price : 0;
    const likelyRtp = allIn > 0 ? avgRent / allIn : 0;

    // FMR-based ROI
    const fmr = getFmr(zip, beds);
    const fmrRoi = allIn > 0 && fmr ? fmr / allIn : 0;

    // Market rent comp
    const rentComp = getRentComp(zip, beds);

    return {
      repairEstimate,
      arvQuick,
      arv,
      allIn,
      offer75,
      percentArv,
      currentRtp,
      likelyRtp,
      fmr,
      fmrRoi,
      rentComp,
    };
  }, [inputs]);

  // Determine RTP color coding (thresholds: green ≥1.3%, orange ≥1.0%, red <1.0%)
  const getRtpColor = (rtp: number): string => {
    if (rtp >= 0.013) return "text-green-600";
    if (rtp >= 0.01) return "text-amber-500";
    return "text-red-600";
  };

  // Determine % of ARV color coding (thresholds: green <75%, orange 75-80%, red >80%)
  const getArvPercentColor = (percent: number): string => {
    if (percent < 0.75) return "text-green-600";
    if (percent <= 0.80) return "text-amber-500";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Property Info */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main St"
                  value={inputs.address}
                  onChange={(e) => updateInput("address", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="St. Louis"
                  value={inputs.city}
                  onChange={(e) => updateInput("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">
                  ZIP Code
                  <InfoTooltip content="Select a supported North County ZIP for automatic ARV and FMR lookups" />
                </Label>
                <Select
                  value={inputs.zip}
                  onValueChange={handleZipChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ZIP" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedZips.map((zip) => (
                      <SelectItem key={zip} value={zip}>
                        {zip}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="beds">Beds</Label>
                <Input
                  id="beds"
                  type="number"
                  min="0"
                  value={inputs.beds || ""}
                  onChange={(e) => handleBedsChange(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baths">Baths</Label>
                <Input
                  id="baths"
                  type="number"
                  min="0"
                  step="0.5"
                  value={inputs.baths || ""}
                  onChange={(e) => updateInput("baths", Number(e.target.value))}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="sqft">Square Feet</Label>
                <Input
                  id="sqft"
                  type="number"
                  min="0"
                  value={inputs.sqft || ""}
                  onChange={(e) => updateInput("sqft", Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financials */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Financial Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Asking Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    className="pl-7"
                    value={inputs.price || ""}
                    onChange={(e) => updateInput("price", Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentRent">Current Rent</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="currentRent"
                    type="number"
                    min="0"
                    className="pl-7"
                    value={inputs.currentRent || ""}
                    onChange={(e) =>
                      updateInput("currentRent", Number(e.target.value))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="avgRent">
                  Expected Rent
                  <InfoTooltip content="Defaults to ZIP Average Rent. Enter a value to override." />
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="avgRent"
                    type="number"
                    min="0"
                    className="pl-7"
                    placeholder="Auto"
                    value={inputs.avgRent || ""}
                    onChange={(e) => handleAvgRentChange(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualArv">
                  Manual ARV
                  <InfoTooltip content="Leave blank to use auto-calculated ARV based on ZIP code" />
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="manualArv"
                    type="number"
                    min="0"
                    className="pl-7"
                    placeholder="Auto"
                    value={inputs.manualArv || ""}
                    onChange={(e) =>
                      updateInput("manualArv", Number(e.target.value))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="repairPreset">Repair Preset</Label>
                <Select
                  value={inputs.repairPreset}
                  onValueChange={(value) =>
                    updateInput("repairPreset", value as RepairPreset)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REPAIR_PRESET_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualRepairs">
                  Manual Repairs
                  <InfoTooltip content="Leave blank to use preset calculation" />
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="manualRepairs"
                    type="number"
                    min="0"
                    className="pl-7"
                    placeholder="Auto"
                    value={inputs.manualRepairs || ""}
                    onChange={(e) =>
                      updateInput("manualRepairs", Number(e.target.value))
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Analysis Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Cost Analysis */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Cost Analysis
              </h4>
              <ResultRow
                label="Repair Estimate"
                value={formatCurrency(calculations.repairEstimate)}
                tooltip="Based on preset or manual entry"
              />
              <ResultRow
                label="All-In Cost"
                value={formatCurrency(calculations.allIn)}
                tooltip="Purchase price + repairs"
                highlight
              />
              <ResultRow
                label="75% ARV Offer"
                value={formatCurrency(calculations.offer75)}
                tooltip="BRRR formula: (ARV × 75%) - Repairs"
                highlight
              />
            </div>

            {/* Value Analysis */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Value Analysis
              </h4>
              <ResultRow
                label="ARV Quick"
                value={
                  calculations.arvQuick
                    ? formatCurrency(calculations.arvQuick)
                    : "N/A"
                }
                tooltip="Auto-calculated: SF × ARV per SF for ZIP"
              />
              <ResultRow
                label="ARV (Used)"
                value={formatCurrency(calculations.arv)}
                tooltip="Manual ARV if entered, otherwise auto"
                highlight
              />
              <div
                className={`flex justify-between items-center py-2 px-3 rounded`}
              >
                <span className="text-sm text-muted-foreground flex items-center">
                  % of ARV
                  <InfoTooltip content="Purchase price as % of ARV. Green <75%, Orange 75-80%, Red >80%" />
                </span>
                <span
                  className={`font-mono text-sm font-semibold ${getArvPercentColor(
                    calculations.percentArv
                  )}`}
                >
                  {formatPercent(calculations.percentArv)}
                </span>
              </div>
            </div>

            {/* Return Analysis */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Return Analysis
              </h4>
              <ResultRow
                label="Current RTP"
                value={formatPercent(calculations.currentRtp)}
                tooltip="Current rent ÷ price. Target: 1.3%+ monthly"
              />
              <div
                className={`flex justify-between items-center py-2 px-3 rounded bg-primary/10`}
              >
                <span className="text-sm text-muted-foreground flex items-center">
                  Likely RTP
                  <InfoTooltip content="Expected rent ÷ all-in cost. Target: 1.3%+ monthly" />
                </span>
                <span
                  className={`font-mono text-sm font-semibold ${getRtpColor(
                    calculations.likelyRtp
                  )}`}
                >
                  {formatPercent(calculations.likelyRtp)}
                </span>
              </div>
              <ResultRow
                label="FMR ROI"
                value={formatPercent(calculations.fmrRoi)}
                tooltip="HUD Fair Market Rent ÷ all-in cost"
              />
            </div>
          </div>

          {/* Reference Data */}
          {inputs.zip && (
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Reference Data for {inputs.zip}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-muted/50 rounded p-3">
                  <p className="text-muted-foreground text-xs">HUD FMR ({inputs.beds}BR)</p>
                  <p className="font-mono font-medium">
                    {calculations.fmr ? formatCurrency(calculations.fmr) : "N/A"}
                  </p>
                </div>
                <div className="bg-muted/50 rounded p-3">
                  <p className="text-muted-foreground text-xs">ZIP Average Rent ({inputs.beds}BR)</p>
                  <p className="font-mono font-medium">
                    {calculations.rentComp
                      ? formatCurrency(calculations.rentComp)
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-muted/50 rounded p-3">
                  <p className="text-muted-foreground text-xs">Average ARV per SF</p>
                  <p className="font-mono font-medium">
                    {calculations.arvQuick && inputs.sqft
                      ? `$${Math.round(calculations.arvQuick / inputs.sqft)}/sf`
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-muted/50 rounded p-3">
                  <p className="text-muted-foreground text-xs">Repair Rate</p>
                  <p className="font-mono font-medium">
                    {REPAIR_PRESET_LABELS[inputs.repairPreset]}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DealAnalyzer;
