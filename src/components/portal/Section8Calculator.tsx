import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Calculator, Info, CheckCircle, XCircle } from "lucide-react";
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
  getFmr,
  getUtilityAllowance,
  getSupportedZips,
} from "@/data/stlZipData";

interface Section8Inputs {
  address: string;
  city: string;
  zip: string;
  beds: number;
  contractRent: number;
}

const initialInputs: Section8Inputs = {
  address: "",
  city: "",
  zip: "",
  beds: 3,
  contractRent: 0,
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
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

const Section8Calculator = () => {
  const [searchParams] = useSearchParams();
  const [inputs, setInputs] = useState<Section8Inputs>(initialInputs);
  const supportedZips = getSupportedZips();

  // Auto-populate from URL params
  useEffect(() => {
    const address = searchParams.get("address");
    const city = searchParams.get("city");
    const zip = searchParams.get("zip");
    const beds = searchParams.get("beds");
    const rent = searchParams.get("rent");

    if (address || city || zip || beds || rent) {
      setInputs((prev) => ({
        ...prev,
        address: address || prev.address,
        city: city || prev.city,
        zip: zip || prev.zip,
        beds: beds ? Number(beds) : prev.beds,
        contractRent: rent ? Number(rent) : prev.contractRent,
      }));
    }
  }, [searchParams]);

  const updateInput = <K extends keyof Section8Inputs>(
    key: K,
    value: Section8Inputs[K]
  ) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  // Calculations
  const calculations = useMemo(() => {
    const { zip, beds, contractRent } = inputs;

    // Get FMR (Payment Standard) for this ZIP and bedroom count
    const paymentStandard = getFmr(zip, beds);
    
    // Get utility allowance for bedroom count
    const utilityAllowance = getUtilityAllowance(beds);

    // Gross Rent = Contract Rent + Utility Allowance
    const grossRent = contractRent + utilityAllowance;

    // Maximum Contract Rent = Payment Standard - Utility Allowance
    const maxContractRent = paymentStandard ? paymentStandard - utilityAllowance : null;

    // Pass/Fail - Gross Rent must be <= Payment Standard
    const passesRentReasonableness = paymentStandard ? grossRent <= paymentStandard : null;

    // Difference from max
    const difference = maxContractRent !== null ? maxContractRent - contractRent : null;

    return {
      paymentStandard,
      utilityAllowance,
      grossRent,
      maxContractRent,
      passesRentReasonableness,
      difference,
    };
  }, [inputs]);

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
                  <InfoTooltip content="Select a supported North County ZIP for FMR lookup" />
                </Label>
                <Select
                  value={inputs.zip}
                  onValueChange={(value) => updateInput("zip", value)}
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

            <div className="space-y-2">
              <Label htmlFor="beds">Bedrooms</Label>
              <Select
                value={String(inputs.beds)}
                onValueChange={(value) => updateInput("beds", Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                    <SelectItem key={num} value={String(num)}>
                      {num === 0 ? "Studio" : `${num} BR`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Rent Input */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Rent Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contractRent">
                Proposed Contract Rent
                <InfoTooltip content="The monthly rent you would charge before utilities" />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="contractRent"
                  type="number"
                  min="0"
                  className="pl-7"
                  value={inputs.contractRent || ""}
                  onChange={(e) =>
                    updateInput("contractRent", Number(e.target.value))
                  }
                />
              </div>
            </div>

            {/* Quick reference */}
            {inputs.zip && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Reference for {inputs.zip} ({inputs.beds === 0 ? "Studio" : `${inputs.beds}BR`})
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">HUD FMR</p>
                    <p className="font-mono font-medium">
                      {calculations.paymentStandard
                        ? formatCurrency(calculations.paymentStandard)
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Utility Allowance</p>
                    <p className="font-mono font-medium">
                      {formatCurrency(calculations.utilityAllowance)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">HAP Analysis Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Rent Breakdown */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Rent Breakdown
              </h4>
              <ResultRow
                label="Contract Rent"
                value={formatCurrency(inputs.contractRent)}
                tooltip="Your proposed monthly rent"
              />
              <ResultRow
                label="Utility Allowance"
                value={formatCurrency(calculations.utilityAllowance)}
                tooltip="HUD-determined tenant utility costs by bedroom count"
              />
              <ResultRow
                label="Gross Rent"
                value={formatCurrency(calculations.grossRent)}
                tooltip="Contract Rent + Utility Allowance"
                highlight
              />
            </div>

            {/* Payment Standard Analysis */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Payment Standard Analysis
              </h4>
              <ResultRow
                label="Payment Standard (FMR)"
                value={
                  calculations.paymentStandard
                    ? formatCurrency(calculations.paymentStandard)
                    : "Select ZIP"
                }
                tooltip="Maximum gross rent allowed under Section 8"
              />
              <ResultRow
                label="Max Contract Rent"
                value={
                  calculations.maxContractRent !== null
                    ? formatCurrency(calculations.maxContractRent)
                    : "N/A"
                }
                tooltip="Payment Standard minus Utility Allowance"
                highlight
              />
              <ResultRow
                label="Difference"
                value={
                  calculations.difference !== null
                    ? formatCurrency(calculations.difference)
                    : "N/A"
                }
                tooltip="Room between your rent and the maximum"
              />
            </div>
          </div>

          {/* Pass/Fail Indicator */}
          {inputs.zip && inputs.contractRent > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <div
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  calculations.passesRentReasonableness
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {calculations.passesRentReasonableness ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">
                        Passes Rent Reasonableness
                      </p>
                      <p className="text-sm text-green-700">
                        Gross rent ({formatCurrency(calculations.grossRent)}) is at or 
                        below the payment standard ({formatCurrency(calculations.paymentStandard!)}).
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">
                        Exceeds Payment Standard
                      </p>
                      <p className="text-sm text-red-700">
                        Gross rent ({formatCurrency(calculations.grossRent)}) exceeds 
                        the payment standard ({formatCurrency(calculations.paymentStandard!)}) by{" "}
                        {formatCurrency(calculations.grossRent - calculations.paymentStandard!)}.
                        Reduce contract rent to {formatCurrency(calculations.maxContractRent!)} or below.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-6 p-3 bg-muted/50 rounded text-xs text-muted-foreground">
            <strong className="text-foreground">Note:</strong> This calculator uses 2025 HUD 
            Small Area Fair Market Rents (SAFMR) as the payment standard. Actual HAP payments 
            depend on tenant income and housing authority determinations. Final rent reasonableness 
            is determined by the local housing authority.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Section8Calculator;