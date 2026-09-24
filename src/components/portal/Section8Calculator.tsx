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
  getSection8SupportedZips,
  UTILITY_BREAKDOWN,
} from "@/data/stlZipData";

interface Section8Inputs {
  // Property info
  address: string;
  zip: string;
  propertyBeds: number;
  voucherBeds: number;
  // Rent comps (up to 5)
  rentComp1: number;
  rentComp2: number;
  rentComp3: number;
  rentComp4: number;
  rentComp5: number;
  // Core inputs
  paymentStandard: number;
  utilityAllowance: number;
  requestedRentToOwner: number;
  tenantMonthlyIncome: number;
}

const initialInputs: Section8Inputs = {
  address: "",
  zip: "",
  propertyBeds: 3,
  voucherBeds: 3,
  rentComp1: 0,
  rentComp2: 0,
  rentComp3: 0,
  rentComp4: 0,
  rentComp5: 0,
  paymentStandard: 0,
  utilityAllowance: 0,
  requestedRentToOwner: 0,
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
  const supportedZips = getSection8SupportedZips();
  const [heating, setHeating] = useState<"owner" | "naturalGas" | "electric">("owner");
  const [cooking, setCooking] = useState<"owner" | "naturalGas" | "electric">("owner");
  const [waterHeating, setWaterHeating] = useState<"owner" | "naturalGas" | "electric">("owner");
  const [water, setWater] = useState<"owner" | "city" | "county">("owner");
  const [tenantOtherElectric, setTenantOtherElectric] = useState(false);
  const [tenantSewer, setTenantSewer] = useState(false);
  const [tenantTrash, setTenantTrash] = useState(false);
  const [tenantRange, setTenantRange] = useState(false);
  const [tenantRefrigerator, setTenantRefrigerator] = useState(false);
  const effectiveBeds = Math.min(inputs.propertyBeds, inputs.voucherBeds);

  // Auto-populate Payment Standard from ZIP/effective bedroom size.
  useEffect(() => {
    if (inputs.zip && effectiveBeds >= 0) {
      const fmr = getFmr(inputs.zip, effectiveBeds);
      if (fmr) setInputs(prev => ({ ...prev, paymentStandard: fmr }));
    }
  }, [inputs.zip, effectiveBeds]);

  // 2026 HASLC Single Family Detached utility allowance: include only tenant-paid items.
  useEffect(() => {
    const i = Math.min(Math.max(effectiveBeds, 0), 6);
    let ua = 0;
    if (heating === "naturalGas") ua += UTILITY_BREAKDOWN.heatingNaturalGas[i];
    if (heating === "electric") ua += UTILITY_BREAKDOWN.heatingElectric[i];
    if (cooking === "naturalGas") ua += UTILITY_BREAKDOWN.cookingNaturalGas[i];
    if (cooking === "electric") ua += UTILITY_BREAKDOWN.cookingElectric[i];
    if (waterHeating === "naturalGas") ua += UTILITY_BREAKDOWN.waterHeatingNaturalGas[i];
    if (waterHeating === "electric") ua += UTILITY_BREAKDOWN.waterHeatingElectric[i];
    if (water === "city") ua += UTILITY_BREAKDOWN.waterCity[i];
    if (water === "county") ua += UTILITY_BREAKDOWN.waterCounty[i];
    if (tenantOtherElectric) ua += UTILITY_BREAKDOWN.otherElectric[i];
    if (tenantSewer) ua += UTILITY_BREAKDOWN.sewer[i];
    if (tenantTrash) ua += UTILITY_BREAKDOWN.trash[i];
    if (tenantRange) ua += UTILITY_BREAKDOWN.range[i];
    if (tenantRefrigerator) ua += UTILITY_BREAKDOWN.refrigerator[i];
    setInputs(prev => ({ ...prev, utilityAllowance: ua }));
  }, [effectiveBeds, heating, cooking, waterHeating, water, tenantOtherElectric, tenantSewer, tenantTrash, tenantRange, tenantRefrigerator]);

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
        propertyBeds: beds ? Number(beds) : prev.propertyBeds,
        voucherBeds: beds ? Number(beds) : prev.voucherBeds,
        rentComp1: rent ? Number(rent) : prev.rentComp1,
        requestedRentToOwner: rent ? Number(rent) : prev.requestedRentToOwner,
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
      requestedRentToOwner,
      rentComp1, rentComp2, rentComp3, rentComp4, rentComp5 
    } = inputs;

    // Rent comps inform the request, but Requested Rent remains independently editable.
    const rentComps = [rentComp1, rentComp2, rentComp3, rentComp4, rentComp5].filter(r => r > 0);
    const highestRent = rentComps.length > 0 ? Math.max(...rentComps) : 0;

    // === CORE CALCULATIONS ===
    const baseRentToOwner = Math.max(0, paymentStandard - utilityAllowance);
    const minimumIncomeNeeded = requestedRentToOwner <= baseRentToOwner
      ? 0
      : (requestedRentToOwner - baseRentToOwner) / 0.10;
    const incomeDifference = tenantMonthlyIncome - minimumIncomeNeeded;
    
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
      baseRentToOwner,
      minimumIncomeNeeded,
      incomeDifference,
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
            <li>Enter rent comps, then set Requested Rent to Owner independently</li>
            <li>Select ZIP, property bedrooms, and voucher bedrooms; the lower bedroom count drives PS and UA</li>
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
                <Label>Property Bedrooms</Label>
                <Select value={String(inputs.propertyBeds)} onValueChange={(value) => updateInput("propertyBeds", Number(value))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[0,1,2,3,4,5,6].map((num) => <SelectItem key={num} value={String(num)}>{num === 0 ? "Studio" : `${num} BR`}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Voucher Bedrooms</Label>
                <Select value={String(inputs.voucherBeds)} onValueChange={(value) => updateInput("voucherBeds", Number(value))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[0,1,2,3,4,5,6].map((num) => <SelectItem key={num} value={String(num)}>{num === 0 ? "Studio" : `${num} BR`}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 text-sm text-muted-foreground">
                Effective size for Payment Standard and Utility Allowance: <strong className="text-foreground">{effectiveBeds === 0 ? "Studio" : `${effectiveBeds} BR`}</strong>
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

              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-sm font-medium">Tenant-Paid Utilities — HASLC Single Family 2026</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Heating</Label><Select value={heating} onValueChange={(v) => setHeating(v as typeof heating)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="owner">Owner Pays</SelectItem><SelectItem value="naturalGas">Tenant — Natural Gas</SelectItem><SelectItem value="electric">Tenant — Electric</SelectItem></SelectContent></Select></div>
                  <div><Label>Cooking</Label><Select value={cooking} onValueChange={(v) => setCooking(v as typeof cooking)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="owner">Owner Pays</SelectItem><SelectItem value="naturalGas">Tenant — Natural Gas</SelectItem><SelectItem value="electric">Tenant — Electric</SelectItem></SelectContent></Select></div>
                  <div><Label>Water Heating</Label><Select value={waterHeating} onValueChange={(v) => setWaterHeating(v as typeof waterHeating)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="owner">Owner Pays</SelectItem><SelectItem value="naturalGas">Tenant — Natural Gas</SelectItem><SelectItem value="electric">Tenant — Electric</SelectItem></SelectContent></Select></div>
                  <div><Label>Water</Label><Select value={water} onValueChange={(v) => setWater(v as typeof water)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="owner">Owner Pays</SelectItem><SelectItem value="city">Tenant — City</SelectItem><SelectItem value="county">Tenant — County</SelectItem></SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ["Other Electric", tenantOtherElectric, setTenantOtherElectric],
                    ["Sewer", tenantSewer, setTenantSewer],
                    ["Trash", tenantTrash, setTenantTrash],
                    ["Tenant Provides Range", tenantRange, setTenantRange],
                    ["Tenant Provides Refrigerator", tenantRefrigerator, setTenantRefrigerator],
                  ].map(([label, checked, setter]) => (
                    <label key={label as string} className="flex items-center gap-2">
                      <input type="checkbox" checked={checked as boolean} onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)} />
                      {label as string}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Source: County Housing / HUD Form-52667, Single Family Detached S8, effective 01/01/2026.</p>
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
                    className="pl-7 bg-muted"
                    value={inputs.utilityAllowance || ""}
                    readOnly
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
              Enter rent comps from Rentometer. Requested Rent remains independently editable.
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

            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Highest Entered Comp</span>
                <span className="font-mono font-semibold">{formatCurrency(calculations.highestRent)}</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="requestedRentToOwner">Requested Rent to Owner</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input id="requestedRentToOwner" type="number" min="0" className="pl-7 bg-primary/5 border-primary/30"
                    value={inputs.requestedRentToOwner || ""}
                    onChange={(e) => updateInput("requestedRentToOwner", Number(e.target.value))} />
                </div>
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
          <div className="grid md:grid-cols-3 gap-3 mb-6">
            <ResultRow label="30% Basis Rent to Owner" value={formatCurrency(calculations.baseRentToOwner)} tooltip="Payment Standard minus Utility Allowance" highlight />
            <ResultRow label="Minimum Monthly Income Needed" value={formatCurrency(calculations.minimumIncomeNeeded)} tooltip="Estimated income needed when Requested Rent exceeds the 30% basis" highlight />
            <ResultRow label="Income Above / (Below) Minimum" value={formatCurrency(calculations.incomeDifference)} />
          </div>
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
                variant={calculations.covers30 && inputs.requestedRentToOwner > 0 ? "success" : "default"}
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
                variant={!calculations.covers30 && calculations.covers40 && inputs.requestedRentToOwner > 0 ? "warning" : "default"}
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
          {inputs.requestedRentToOwner > 0 && inputs.tenantMonthlyIncome > 0 && inputs.paymentStandard > 0 && (
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
