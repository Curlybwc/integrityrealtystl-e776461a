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
  tenantMonthlyIncome: number;
  requestedRent: number;
}

const initialInputs: Section8Inputs = {
  address: "",
  city: "",
  zip: "",
  beds: 3,
  contractRent: 0,
  tenantMonthlyIncome: 0,
  requestedRent: 0,
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
    const { zip, beds, contractRent, tenantMonthlyIncome, requestedRent } = inputs;

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

    // === TENANT INCOME CALCULATIONS ===
    // Total Tenant Payment (TTP) at 30% - This is what tenant pays including utilities
    const ttpAt30 = tenantMonthlyIncome * 0.30;
    const ttpAt40 = tenantMonthlyIncome * 0.40;

    // Tenant Rent Portion = TTP minus Utility Allowance (what they pay to landlord)
    const tenantRentPortionAt30 = Math.max(0, ttpAt30 - utilityAllowance);
    const tenantRentPortionAt40 = Math.max(0, ttpAt40 - utilityAllowance);

    // HAP Payment = Payment Standard minus TTP at 30%
    const hapPayment = paymentStandard ? Math.max(0, paymentStandard - ttpAt30) : null;

    // Total Allowable Gross Rent at 30% (HAP + TTP at 30%)
    const totalAllowableGRAt30 = hapPayment !== null ? hapPayment + ttpAt30 : null;
    
    // Rent to Owner at 30% (Total Allowable GR - Utility Allowance)
    const rentToOwnerAt30 = totalAllowableGRAt30 !== null ? totalAllowableGRAt30 - utilityAllowance : null;

    // Total Allowable Gross Rent at 40% (HAP + TTP at 40%)
    const totalAllowableGRAt40 = hapPayment !== null ? hapPayment + ttpAt40 : null;
    
    // Max Rent to Owner at 40% (Total Allowable GR at 40% - Utility Allowance)
    const maxRentToOwnerAt40 = totalAllowableGRAt40 !== null ? totalAllowableGRAt40 - utilityAllowance : null;

    // === MINIMUM INCOME CALCULATION ===
    // Given a requested rent, calculate minimum tenant income needed
    // Gross Rent = Requested Rent + Utility Allowance
    const requestedGrossRent = requestedRent + utilityAllowance;
    
    // Using 30%: TTP at 30% >= Gross Rent - HAP
    // Since HAP = Payment Standard - TTP at 30%, we need to solve for income
    // If rent exceeds what HAP covers at 30%, tenant needs to pay more (up to 40%)
    
    // At 30% TTP: Min income where Rent to Owner at 30% = Requested Rent
    // rentToOwnerAt30 = (PS - 0.30*income) + 0.30*income - UA = PS - UA
    // So at 30%, the max rent to owner is just PS - UA (independent of income if HAP covers it)
    
    // The question is: what income is needed for tenant portion to cover the gap?
    // If requestedRent > (PS - UA), tenant must pay more from their TTP
    
    // For 30%: Income needed = (Requested Rent + UA) / 0.30 if tenant pays full rent
    // For 40%: Income needed = (Requested Rent + UA) / 0.40 if tenant pays full rent
    
    // More accurate: If HAP covers some, what's the minimum income for 30% to work?
    // TTP at 30% = 0.30 * income
    // Tenant rent portion = TTP - UA = 0.30 * income - UA
    // HAP = PS - TTP = PS - 0.30 * income
    // Total rent to owner = HAP + Tenant rent portion = PS - UA
    // So at 30%, max is PS - UA regardless of income (as long as TTP > 0)
    
    // The real question: what income is needed so that using 40% TTP can cover the requested rent?
    // Tenant rent portion at 40% = 0.40 * income - UA
    // HAP = PS - 0.30 * income (HAP is always based on 30%)
    // Max rent to owner at 40% = HAP + (0.40 * income) - UA = PS - 0.30*income + 0.40*income - UA = PS + 0.10*income - UA
    // For this to equal requested rent: PS + 0.10*income - UA = requestedRent
    // 0.10 * income = requestedRent - PS + UA
    // income = (requestedRent - PS + UA) / 0.10
    // income = (requestedRent + UA - PS) / 0.10

    let minIncomeFor30: number | null = null;
    let minIncomeFor40: number | null = null;
    
    if (paymentStandard && requestedRent > 0) {
      // At 30%: rent to owner can be at most PS - UA
      // If requested rent <= PS - UA, any income works (as long as tenant qualifies for voucher)
      // If requested rent > PS - UA, 30% alone can't cover it
      const maxRentAt30Only = paymentStandard - utilityAllowance;
      
      if (requestedRent <= maxRentAt30Only) {
        // 30% works - minimum income is essentially $0 (voucher covers it)
        minIncomeFor30 = 0;
      } else {
        // 30% can't cover this rent alone
        minIncomeFor30 = null;
      }
      
      // At 40%: rent to owner = PS + 0.10*income - UA
      // Solve for income: income = (requestedRent + UA - PS) / 0.10
      const incomeNeededFor40 = (requestedRent + utilityAllowance - paymentStandard) / 0.10;
      
      if (requestedRent <= maxRentAt30Only) {
        // 30% already covers it, no extra income needed
        minIncomeFor40 = 0;
      } else if (incomeNeededFor40 > 0) {
        minIncomeFor40 = Math.ceil(incomeNeededFor40);
      } else {
        minIncomeFor40 = 0;
      }
    }

    return {
      paymentStandard,
      utilityAllowance,
      grossRent,
      maxContractRent,
      passesRentReasonableness,
      difference,
      // Tenant income calculations
      ttpAt30,
      ttpAt40,
      tenantRentPortionAt30,
      tenantRentPortionAt40,
      hapPayment,
      totalAllowableGRAt30,
      rentToOwnerAt30,
      totalAllowableGRAt40,
      maxRentToOwnerAt40,
      // Minimum income calculations
      minIncomeFor30,
      minIncomeFor40,
      requestedGrossRent,
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

      {/* Tenant Income Analysis Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Tenant Income Analysis
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Calculate HAP and tenant portions based on tenant's reported monthly income
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-populated values from ZIP/Bedrooms */}
          {inputs.zip && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Payment Standard (SAFMR)</p>
                <p className="font-mono font-semibold text-foreground">
                  {calculations.paymentStandard
                    ? formatCurrency(calculations.paymentStandard)
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Utility Allowance</p>
                <p className="font-mono font-semibold text-foreground">
                  {formatCurrency(calculations.utilityAllowance)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ZIP Code</p>
                <p className="font-mono font-semibold text-foreground">{inputs.zip}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bedrooms</p>
                <p className="font-mono font-semibold text-foreground">
                  {inputs.beds === 0 ? "Studio" : `${inputs.beds} BR`}
                </p>
              </div>
            </div>
          )}

          {!inputs.zip && (
            <div className="p-4 bg-muted/50 border border-border rounded-lg text-sm text-muted-foreground">
              Select a ZIP code above to auto-populate SAFMR and Utility Allowance
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Tenant Income Input */}
            <div className="space-y-2">
              <Label htmlFor="tenantMonthlyIncome">
                Tenant's Monthly Income
                <InfoTooltip content="Use the income reported to the Section 8 caseworker from recent pay stubs" />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="tenantMonthlyIncome"
                  type="number"
                  min="0"
                  className="pl-7"
                  value={inputs.tenantMonthlyIncome || ""}
                  onChange={(e) =>
                    updateInput("tenantMonthlyIncome", Number(e.target.value))
                  }
                  placeholder="3700"
                />
              </div>
            </div>
          </div>

          {/* Tenant Payment Calculations */}
          {inputs.tenantMonthlyIncome > 0 && inputs.zip && (
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-border">
              {/* 30% Calculations */}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  At 30% of Income (Standard)
                </h4>
                <ResultRow
                  label="Total Tenant Payment (TTP)"
                  value={formatCurrency(calculations.ttpAt30)}
                  tooltip="30% of tenant's monthly income - their total housing cost including utilities"
                />
                <ResultRow
                  label="Tenant Rent Portion"
                  value={formatCurrency(calculations.tenantRentPortionAt30)}
                  tooltip="TTP minus Utility Allowance - what tenant pays to landlord"
                />
                <ResultRow
                  label="HAP Payment"
                  value={calculations.hapPayment !== null ? formatCurrency(calculations.hapPayment) : "N/A"}
                  tooltip="Housing Assistance Payment from Section 8 (Payment Standard minus TTP at 30%)"
                  highlight
                />
                <ResultRow
                  label="Rent to Owner at 30%"
                  value={calculations.rentToOwnerAt30 !== null ? formatCurrency(calculations.rentToOwnerAt30) : "N/A"}
                  tooltip="Maximum rent you can charge if tenant pays 30% of income"
                  highlight
                />
              </div>

              {/* 40% Calculations */}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  At 40% of Income (Maximum)
                </h4>
                <ResultRow
                  label="Total Tenant Payment (TTP)"
                  value={formatCurrency(calculations.ttpAt40)}
                  tooltip="40% of tenant's monthly income - maximum allowed housing cost"
                />
                <ResultRow
                  label="Tenant Rent Portion"
                  value={formatCurrency(calculations.tenantRentPortionAt40)}
                  tooltip="TTP at 40% minus Utility Allowance"
                />
                <ResultRow
                  label="HAP Payment (unchanged)"
                  value={calculations.hapPayment !== null ? formatCurrency(calculations.hapPayment) : "N/A"}
                  tooltip="HAP is always calculated at 30% - only tenant portion can increase"
                />
                <ResultRow
                  label="Max Rent to Owner at 40%"
                  value={calculations.maxRentToOwnerAt40 !== null ? formatCurrency(calculations.maxRentToOwnerAt40) : "N/A"}
                  tooltip="Maximum rent if tenant pays up to 40% of income"
                  highlight
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Minimum Income Calculator */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Minimum Income Calculator
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Find the minimum tenant income needed to achieve your target rent
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="requestedRent">
                Requested Rent to Owner
                <InfoTooltip content="The rent you want to charge - calculator will determine minimum tenant income needed" />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="requestedRent"
                  type="number"
                  min="0"
                  className="pl-7"
                  value={inputs.requestedRent || ""}
                  onChange={(e) =>
                    updateInput("requestedRent", Number(e.target.value))
                  }
                  placeholder="1700"
                />
              </div>
            </div>

            {inputs.requestedRent > 0 && inputs.zip && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground">
                  For {formatCurrency(inputs.requestedRent)} rent in {inputs.zip}
                </p>
                
                {calculations.minIncomeFor30 === 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-700 font-medium">
                        Covered at 30% TTP
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Rent is within Payment Standard. HAP covers the gap regardless of income.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-amber-700 font-medium">
                        Requires 40% TTP
                      </span>
                    </div>
                    {calculations.minIncomeFor40 !== null && calculations.minIncomeFor40 > 0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">Minimum tenant income needed:</p>
                        <p className="font-mono font-semibold text-foreground text-lg">
                          {formatCurrency(calculations.minIncomeFor40)}/month
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          (${Math.ceil(calculations.minIncomeFor40 * 12).toLocaleString()}/year)
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                    ? "bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900"
                    : "bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900"
                }`}
              >
                {calculations.passesRentReasonableness ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-500" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-400">
                        Passes Rent Reasonableness
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-500">
                        Gross rent ({formatCurrency(calculations.grossRent)}) is at or 
                        below the payment standard ({formatCurrency(calculations.paymentStandard!)}).
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-500" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-400">
                        Exceeds Payment Standard
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-500">
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