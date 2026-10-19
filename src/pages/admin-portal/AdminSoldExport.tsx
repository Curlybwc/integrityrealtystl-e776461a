import { useState } from "react";
import { Download, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  SOLD_REPORT_COUNTIES,
  getSoldReportWindow,
  type SoldRow,
} from "../../../supabase/functions/_shared/sold-report";

type ExportFormat = "xlsx" | "csv";
type ExportResult = {
  county: string;
  fromDate: string;
  toDate: string;
  rows: SoldRow[];
};

const PREVIEW_LIMIT = 100;
const selectClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const AdminSoldExport = () => {
  const [county, setCounty] = useState<string>(SOLD_REPORT_COUNTIES[0].name);
  const [lookbackDays, setLookbackDays] = useState(30);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = loading || downloading !== null;

  const clearResults = () => {
    setResult(null);
    setError(null);
  };

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    const window = getSoldReportWindow(lookbackDays);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("fetch-sold-listings", {
        body: { county, ...window },
      });
      if (invokeError) {
        let message = invokeError.message;
        if (invokeError.context instanceof Response) {
          try {
            const body: unknown = await invokeError.context.json();
            if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
              message = body.error;
            }
          } catch {
            // Keep the SDK message when the error response cannot be decoded.
          }
        }
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);
      if (!Array.isArray(data?.rows)) throw new Error("The sold-listings response could not be read. Please try again.");
      setResult({ county, ...window, rows: data.rows as SoldRow[] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sold listings could not be fetched. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const download = async (format: ExportFormat) => {
    if (!result || result.rows.length === 0) return;
    setDownloading(format);
    setError(null);

    try {
      const [{ buildSoldExport }, { zipSync }] = await Promise.all([
        import("../../../supabase/functions/_shared/sold-export"),
        import("fflate"),
      ]);
      const file = buildSoldExport(result.rows, result.county, result.fromDate, result.toDate, format, zipSync);
      const blob = new Blob([new Uint8Array(file.bytes)], { type: file.contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The download could not be prepared. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium text-foreground">Sold Listings Export</h1>
        <p className="text-muted-foreground">Find recently sold homes and download an address list for your selected county.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report filters</CardTitle>
          <CardDescription>County coverage follows ZIP codes and may overlap neighboring counties.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sold-county">County</Label>
              <select
                id="sold-county"
                className={selectClassName}
                value={county}
                disabled={busy}
                onChange={(event) => { setCounty(event.target.value); clearResults(); }}
              >
                {SOLD_REPORT_COUNTIES.map((item) => <option key={item.slug} value={item.name}>{item.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sold-lookback">Look-back period</Label>
              <select
                id="sold-lookback"
                className={selectClassName}
                value={lookbackDays}
                disabled={busy}
                onChange={(event) => { setLookbackDays(Number(event.target.value)); clearResults(); }}
              >
                {[7, 30, 60, 90].map((days) => <option key={days} value={days}>Last {days} days</option>)}
              </select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Includes today and the preceding {lookbackDays - 1} days, using UTC dates.</p>
          <Button onClick={fetchListings} disabled={busy}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            {loading ? "Fetching sold listings…" : "Fetch sold listings"}
          </Button>
        </CardContent>
      </Card>

      {error && <p role="alert" className="rounded-md border border-destructive p-4 text-sm text-destructive">{error}</p>}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg" aria-live="polite">{result.rows.length.toLocaleString()} sold {result.rows.length === 1 ? "home" : "homes"}</CardTitle>
            <CardDescription>{result.county} · {result.fromDate} through {result.toDate} (UTC)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {(["xlsx", "csv"] as const).map((format) => (
                <Button key={format} variant={format === "xlsx" ? "default" : "outline"} disabled={busy || result.rows.length === 0} onClick={() => download(format)}>
                  {downloading === format ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Download {format.toUpperCase()}
                </Button>
              ))}
            </div>
            {result.rows.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">No sold homes were found for this county and date range.</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Previewing {Math.min(result.rows.length, PREVIEW_LIMIT).toLocaleString()} of {result.rows.length.toLocaleString()} homes. Downloads include all results.
                </p>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Address</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>ZIP</TableHead>
                        <TableHead>Date Sold</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rows.slice(0, PREVIEW_LIMIT).map((row, index) => (
                        <TableRow key={`${row.mlsNumber}-${index}`}>
                          <TableCell className="font-medium">{row.address}</TableCell>
                          <TableCell>{row.city}</TableCell>
                          <TableCell>{row.state}</TableCell>
                          <TableCell>{row.zip}</TableCell>
                          <TableCell>{row.soldDate}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSoldExport;
