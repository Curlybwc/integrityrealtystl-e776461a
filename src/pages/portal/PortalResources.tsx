import { Table, FileText, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FMR_BY_ZIP,
  UTILITY_ALLOWANCES,
  ARV_PER_SF,
  RENT_COMPS_BY_ZIP,
} from "@/data/stlZipData";
import UtilityAllowanceCalculator from "@/components/portal/UtilityAllowanceCalculator";

const PortalResources = () => {
  // Get sorted ZIP codes
  const sortedZips = Object.keys(FMR_BY_ZIP).sort();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">
          Resources
        </h1>
        <p className="text-muted-foreground text-sm">
          Reference data for North County St. Louis investment analysis.
        </p>
      </div>

      {/* SAFMR Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="w-5 h-5 text-primary" />
            2025 HUD Small Area Fair Market Rents (SAFMR)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Payment standards for Section 8 vouchers by ZIP code and bedroom count.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <UITable>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">ZIP Code</TableHead>
                  <TableHead className="text-right">Studio</TableHead>
                  <TableHead className="text-right">1 BR</TableHead>
                  <TableHead className="text-right">2 BR</TableHead>
                  <TableHead className="text-right">3 BR</TableHead>
                  <TableHead className="text-right">4 BR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedZips.map((zip) => {
                  const fmr = FMR_BY_ZIP[zip];
                  return (
                    <TableRow key={zip}>
                      <TableCell className="font-medium">{zip}</TableCell>
                      <TableCell className="text-right font-mono">${fmr[0].toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">${fmr[1].toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">${fmr[2].toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">${fmr[3].toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">${fmr[4].toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </UITable>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Source: HUD FY2025 Small Area Fair Market Rents. Data subject to change.
          </p>
        </CardContent>
      </Card>

      {/* Utility Allowance Calculator */}
      <UtilityAllowanceCalculator />

      {/* Default Utility Allowances Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Default Utility Allowances (HASLC Single Family 2025)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Pre-calculated allowances assuming: Natural Gas Heating, Electric Cooking, Other Electric, County Water, Sewer, Trash.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <UITable>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Bedrooms</TableHead>
                  <TableHead className="text-right">Monthly Allowance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(UTILITY_ALLOWANCES).map(([beds, amount]) => (
                  <TableRow key={beds}>
                    <TableCell className="font-medium">
                      {beds === "0" ? "Studio" : `${beds} BR`}
                    </TableCell>
                    <TableCell className="text-right font-mono">${amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </UITable>
          </div>
        </CardContent>
      </Card>

      {/* ARV & Rent Comps Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Market Data by ZIP Code
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Average ARV per square foot and market rent comps for analysis.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <UITable>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">ZIP Code</TableHead>
                  <TableHead className="text-right">Avg ARV/SF</TableHead>
                  <TableHead className="text-right">2 BR Rent</TableHead>
                  <TableHead className="text-right">3 BR Rent</TableHead>
                  <TableHead className="text-right">4 BR Rent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(ARV_PER_SF).sort().map((zip) => {
                  const arv = ARV_PER_SF[zip];
                  const rents = RENT_COMPS_BY_ZIP[zip];
                  return (
                    <TableRow key={zip}>
                      <TableCell className="font-medium">{zip}</TableCell>
                      <TableCell className="text-right font-mono">${arv}/sf</TableCell>
                      <TableCell className="text-right font-mono">
                        {rents ? `$${rents.bed2.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {rents ? `$${rents.bed3.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {rents ? `$${rents.bed4.toLocaleString()}` : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </UITable>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Based on local market analysis. ARV and rent figures are estimates for reference only.
          </p>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Disclaimer:</strong> All data is provided for 
          informational purposes only. Investors should verify all figures independently. 
          Market conditions change; this data may not reflect current values.
        </p>
      </div>
    </div>
  );
};

export default PortalResources;