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
  // Property info
  address: string;
  zip: string;
  beds: number;
  // Rent comps (up to 5)
  rentComp1: number;
  rentComp2: number;
  rentComp3: number;
  rentComp4: number;
  rentComp5: number;
  // Core inputs (can be auto-populated or manual)
  paymentStandard: number;
  utilityAllowance: number;
  tenantMonthlyIncome: number;
}

const initialInputs: Section8Inputs = {
  address: "",
  zip: "",
  beds: 3,
  rentComp1: 0,
  rentComp2: 0,
  rentComp3: 0,
  rentComp4: 0,
  rentComp5: 0,
  paymentStandard: 0,
  utilityAllowance: 0,
  tenantMonthlyIncome: 0,
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
  variant,
}: {
  label: string;
  value: string;
  tooltip?: string;
  highlight?: boolean;
  variant?: "success" | "warning" | "default";
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
        highlight ? "font-semibold text-primary" : 
        variant === "success" ? "font-semibold text-green-600" :
        variant === "warning" ? "font-semibold text-amber-600" :
        "text-foreground"
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

  // Auto-populate Payment Standard and Utility Allowance when ZIP/beds change
  useEffect(() => {
    if (inputs.zip && inputs.beds >= 0) {
      const fmr = getFmr(inputs.zip, inputs.beds);
      const ua = getUtilityAllowance(inputs.beds);
      if (fmr) {
        setInputs(prev => ({
          ...prev,
          paymentStandard: fmr,
          utilityAllowance: ua,
        }));
      }
    }
  }, [inputs.zip, inputs.beds]);

  // Auto-populate from URL params
  useEffect(() => {
    const address = searchParams.get("address");
    const zip = searchParams.get("zip");
    const beds = searchParams.get("beds");
    const rent = searchParams.get("rent");

    if (address || zip || beds || rent) {
      setInputs((prev) => ({
        ...prev,
        address: address || prev.address,
        zip: zip || prev.zip,
        beds: beds ? Number(beds) : prev.beds,
        rentComp1: rent ? Number(rent) : prev.rentComp1,
      }));
    }
  }, [searchParams]);

  const updateInput = <K extends keyof Section8Inputs>(
    key: K,
    value: Section8Inputs[K]
  ) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  // All calculations from the Excel spreadsheet
  const calculations = useMemo(() => {
    const { 
      paymentStandard, 
      utilityAllowance, 
      tenantMonthlyIncome,
      rentComp1, rentComp2, rentComp3, rentComp4, rentComp5 
    } = inputs;

    // Highest Rent from comps (auto-populates Requested Rent to Owner)
    const rentComps = [rentComp1, rentComp2, rentComp3, rentComp4, rentComp5].filter(r => r > 0);
    const highestRent = rentComps.length > 0 ? Math.max(...rentComps) : 0;
    const requestedRentToOwner = highestRent;

    // === CORE CALCULATIONS FROM EXCEL ===
    
    // Total Tenant Payment (TTP) including utilities at 30%
    const ttpAt30 = tenantMonthlyIncome * 0.30;
    
    // Total Tenant Payment (TTP) including utilities at 40%
    const ttpAt40 = tenantMonthlyIncome * 0.40;
    
    // Tenant Rent Portion at 30% = TTP at 30% - Utility Allowance
    const tenantRentPortionAt30 = Math.max(0, ttpAt30 - utilityAllowance);
    
    // Tenant Rent Portion at 40% = TTP at 40% - Utility Allowance
    const tenantRentPortionAt40 = Math.max(0, ttpAt40 - utilityAllowance);
    
    // HAP Payment = Payment Standard - TTP at 30%
    const hapPayment = Math.max(0, paymentStandard - ttpAt30);
    
    // Total Allowable Gross Rent at 30% (HAP + TTP at 30%)
    const totalAllowableGRAt30 = hapPayment + ttpAt30;
    
    // Rent to Owner at 30% = Total Allowable GR at 30% - Utility Allowance
    const rentToOwnerAt30 = totalAllowableGRAt30 - utilityAllowance;
    
    // Total Allowable Gross Rent at 40% (HAP + TTP at 40%)
    const totalAllowableGRAt40 = hapPayment + ttpAt40;
    
    // Max Rent to Owner at 40% = Total Allowable GR at 40% - Utility Allowance
    const maxRentToOwnerAt40 = totalAllowableGRAt40 - utilityAllowance;
    
    // Total Gross Rent based on Requested Rent (RRO + UA)
    const grossRentFromRRO = requestedRentToOwner + utilityAllowance;

    // Determine if 30% covers the requested rent or if 40% is needed
    const covers30 = rentToOwnerAt30 >= requestedRentToOwner;
    const covers40 = maxRentToOwnerAt40 >= requestedRentToOwner;

    return {
      // Comps
      highestRent,
      requestedRentToOwner,
      // TTP calculations
      ttpAt30,
      ttpAt40,
      // Tenant rent portions
      tenantRentPortionAt30,
      tenantRentPortionAt40,
      // HAP
      hapPayment,
      // Gross rent totals
      totalAllowableGRAt30,
      totalAllowableGRAt40,
      // Rent to owner
      rentToOwnerAt30,
      maxRentToOwnerAt40,
      // Based on requested rent
      grossRentFromRRO,
      // Status checks
      covers30,
      covers40,
    };
  }, [inputs]);

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card className="bg-accent/30 border-accent">
        <CardContent className="pt-4">
          <p className="text-sm font-medium text-foreground mb-2">Instructions</p>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Enter rent comps from Rentometer.com - Highest Comp will auto-populate</li>
            <li>Select ZIP code and bedrooms to auto-populate Payment Standard and Utility Allowance (or enter manually)</li>
            <li>Enter the Tenant's Monthly Income - Verify that this is what is reported to Section 8 Caseworker</li>
          </ol>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Inputs */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Subject Property
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St"
                value={inputs.address}
                onChange={(e) => updateInput("address", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zip">
                  ZIP Code
                  <InfoTooltip content="Select ZIP to auto-populate SAFMR" />
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
            </div>

            <div className="pt-4 border-t border-border space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentStandard">
                  Payment Standard (SAFMR)
                  <InfoTooltip content="Auto-populates from ZIP/beds, or enter manually" />
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="paymentStandard"
                    type="number"
                    min="0"
                    className="pl-7 bg-primary/5 border-primary/30"
                    value={inputs.paymentStandard || ""}
                    onChange={(e) => updateInput("paymentStandard", Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="utilityAllowance">
                  Utility Allowance (UA)
                  <InfoTooltip content="Amount HAP allows for tenant utilities" />
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="utilityAllowance"
                    type="number"
                    min="0"
                    className="pl-7 bg-primary/5 border-primary/30"
                    value={inputs.utilityAllowance || ""}
                    onChange={(e) => updateInput("utilityAllowance", Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantMonthlyIncome">
                  Tenant's Monthly Income
                  <InfoTooltip content="Use income reported to Section 8 caseworker from recent pay stubs" />
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="tenantMonthlyIncome"
                    type="number"
                    min="0"
                    className="pl-7 bg-primary/5 border-primary/30"
                    value={inputs.tenantMonthlyIncome || ""}
                    onChange={(e) => updateInput("tenantMonthlyIncome", Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Rental Comps */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Rental Comps</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter rent comps from Rentometer - highest will auto-populate as Requested Rent
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  min="0"
                  className="pl-7"
                  placeholder={`Comp ${num}`}
                  value={inputs[`rentComp${num}` as keyof Section8Inputs] as number || ""}
                  onChange={(e) => updateInput(`rentComp${num}` as keyof Section8Inputs, Number(e.target.value))}
                />
              </div>
            ))}

            <div className="pt-4 border-t border-border">
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium">Highest Rent (RRO)</span>
                <span className="font-mono font-semibold text-primary">
                  {formatCurrency(calculations.highestRent)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Calculation Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: TTP and Tenant Portions */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Total Tenant Portion (TTP)
              </h4>
              <ResultRow
                label="TTP at 30%"
                value={formatCurrency(calculations.ttpAt30)}
                tooltip="Total Tenant Portion at 30% of income - includes rent portion plus tenant-paid utilities"
              />
              <ResultRow
                label="TTP at 40%"
                value={formatCurrency(calculations.ttpAt40)}
                tooltip="Total Tenant Portion at 40% of income (maximum allowed) - includes rent portion plus tenant-paid utilities"
              />
              <ResultRow
                label="Tenant Rent Portion at 30%"
                value={formatCurrency(calculations.tenantRentPortionAt30)}
                tooltip="Tenant's rent payment only (TTP at 30% minus Utility Allowance)"
              />
              <ResultRow
                label="Tenant Rent Portion at 40%"
                value={formatCurrency(calculations.tenantRentPortionAt40)}
                tooltip="Tenant's rent payment only (TTP at 40% minus Utility Allowance)"
              />
            </div>

            {/* Right: HAP and Rent to Owner */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                HAP & Rent to Owner
              </h4>
              <ResultRow
                label="HAP Payment (PS - TTP at 30%)"
                value={formatCurrency(calculations.hapPayment)}
                tooltip="Housing Assistance Payment - does not change even if tenant pays 40%"
                highlight
              />
              <ResultRow
                label="Total Allowable GR at 30%"
                value={formatCurrency(calculations.totalAllowableGRAt30)}
                tooltip="HAP + TTP at 30%"
              />
              <ResultRow
                label="Rent to Owner at 30%"
                value={formatCurrency(calculations.rentToOwnerAt30)}
                tooltip="Use this if it covers your Requested Rent"
                highlight
                variant={calculations.covers30 && calculations.highestRent > 0 ? "success" : "default"}
              />
              <ResultRow
                label="Total Allowable GR at 40%"
                value={formatCurrency(calculations.totalAllowableGRAt40)}
                tooltip="HAP + TTP at 40%"
              />
              <ResultRow
                label="Max Rent to Owner at 40%"
                value={formatCurrency(calculations.maxRentToOwnerAt40)}
                tooltip="Use ONLY if Rent to Owner at 30% is less than Requested Rent"
                highlight
                variant={!calculations.covers30 && calculations.covers40 && calculations.highestRent > 0 ? "warning" : "default"}
              />
            </div>
          </div>

          {/* Gross Rent from Requested */}
          <div className="mt-6 pt-4 border-t border-border">
            <ResultRow
              label="Total Gross Rent based on Requested Rent (RRO + UA)"
              value={formatCurrency(calculations.grossRentFromRRO)}
              tooltip="Your requested rent plus utility allowance"
            />
          </div>

          {/* Status Indicator */}
          {calculations.highestRent > 0 && inputs.tenantMonthlyIncome > 0 && inputs.paymentStandard > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <div
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  calculations.covers30
                    ? "bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900"
                    : calculations.covers40
                    ? "bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
                    : "bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900"
                }`}
              >
                {calculations.covers30 ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-500" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-400">
                        Rent Covered at 30% TTP
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-500">
                        Rent to Owner at 30% ({formatCurrency(calculations.rentToOwnerAt30)}) covers 
                        your Requested Rent ({formatCurrency(calculations.requestedRentToOwner)}).
                      </p>
                    </div>
                  </>
                ) : calculations.covers40 ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-400">
                        Rent Covered at 40% TTP
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-500">
                        Tenant needs to pay 40% of income. Max Rent to Owner ({formatCurrency(calculations.maxRentToOwnerAt40)}) covers 
                        your Requested Rent ({formatCurrency(calculations.requestedRentToOwner)}).
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-500" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-400">
                        Rent Exceeds Maximum
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-500">
                        Even at 40% TTP, max rent ({formatCurrency(calculations.maxRentToOwnerAt40)}) is below 
                        your Requested Rent ({formatCurrency(calculations.requestedRentToOwner)}). 
                        Tenant needs higher income or lower rent.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-6 p-3 bg-muted/50 rounded text-xs text-muted-foreground">
            <strong className="text-foreground">Note:</strong> The HAP payment will not change - only 
            the tenant portion can change (up to 40% if the rent to owner using 30% of the tenant's 
            income is less than the Requested Rent). Final determinations are made by the local housing authority.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Section8Calculator;
