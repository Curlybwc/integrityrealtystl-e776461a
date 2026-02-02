import { useState, useMemo } from "react";
import { Calculator, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  UTILITY_BREAKDOWN,
  calculateCustomUtilityAllowance,
} from "@/data/stlZipData";

const UtilityAllowanceCalculator = () => {
  const [bedrooms, setBedrooms] = useState(3);
  const [heatingType, setHeatingType] = useState<'electric' | 'naturalGas'>('naturalGas');
  const [cookingType, setCookingType] = useState<'electric' | 'naturalGas'>('electric');
  const [waterType, setWaterType] = useState<'city' | 'county'>('county');
  const [waterHeatingType, setWaterHeatingType] = useState<'electric' | 'naturalGas'>('naturalGas');
  const [includeRange, setIncludeRange] = useState(false);
  const [includeRefrigerator, setIncludeRefrigerator] = useState(false);

  const idx = Math.min(Math.max(bedrooms, 0), 6);

  const breakdown = useMemo(() => {
    const heating = heatingType === 'electric' 
      ? { label: 'Heating (Electric)', value: UTILITY_BREAKDOWN.heatingElectric[idx] }
      : { label: 'Heating (Natural Gas)', value: UTILITY_BREAKDOWN.heatingNaturalGas[idx] };
    
    const cooking = cookingType === 'electric'
      ? { label: 'Cooking (Electric)', value: UTILITY_BREAKDOWN.cookingElectric[idx] }
      : { label: 'Cooking (Natural Gas)', value: UTILITY_BREAKDOWN.cookingNaturalGas[idx] };
    
    const water = waterType === 'city'
      ? { label: 'Water (City)', value: UTILITY_BREAKDOWN.waterCity[idx] }
      : { label: 'Water (County)', value: UTILITY_BREAKDOWN.waterCounty[idx] };
    
    const waterHeating = waterHeatingType === 'electric'
      ? { label: 'Water Heating (Electric)', value: UTILITY_BREAKDOWN.waterHeatingElectric[idx] }
      : { label: 'Water Heating (Natural Gas)', value: UTILITY_BREAKDOWN.waterHeatingNaturalGas[idx] };

    const items = [
      heating,
      cooking,
      { label: 'Other Electric', value: UTILITY_BREAKDOWN.otherElectric[idx] },
      water,
      waterHeating,
      { label: 'Sewer', value: UTILITY_BREAKDOWN.sewer[idx] },
      { label: 'Trash Collection', value: UTILITY_BREAKDOWN.trash[idx] },
    ];

    if (includeRange) {
      items.push({ label: 'Range (Tenant Provided)', value: UTILITY_BREAKDOWN.range[idx] });
    }
    if (includeRefrigerator) {
      items.push({ label: 'Refrigerator (Tenant Provided)', value: UTILITY_BREAKDOWN.refrigerator[idx] });
    }

    return items;
  }, [bedrooms, heatingType, cookingType, waterType, waterHeatingType, includeRange, includeRefrigerator, idx]);

  const total = useMemo(() => {
    return calculateCustomUtilityAllowance(bedrooms, {
      heatingType,
      cookingType,
      waterType,
      waterHeatingType,
      includeRange,
      includeRefrigerator,
    });
  }, [bedrooms, heatingType, cookingType, waterType, waterHeatingType, includeRange, includeRefrigerator]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Utility Allowance Calculator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Calculate the exact utility allowance based on your property's specific utilities.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Bedrooms */}
          <div className="space-y-2">
            <Label>Bedrooms</Label>
            <Select value={String(bedrooms)} onValueChange={(v) => setBedrooms(Number(v))}>
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

          {/* Heating Type */}
          <div className="space-y-2">
            <Label>Heating</Label>
            <Select value={heatingType} onValueChange={(v) => setHeatingType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="naturalGas">Natural Gas</SelectItem>
                <SelectItem value="electric">Electric</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cooking Type */}
          <div className="space-y-2">
            <Label>Cooking</Label>
            <Select value={cookingType} onValueChange={(v) => setCookingType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="electric">Electric</SelectItem>
                <SelectItem value="naturalGas">Natural Gas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Water Type */}
          <div className="space-y-2">
            <Label>Water Provider</Label>
            <Select value={waterType} onValueChange={(v) => setWaterType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="county">County</SelectItem>
                <SelectItem value="city">City</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Water Heating Type */}
          <div className="space-y-2">
            <Label>Water Heating</Label>
            <Select value={waterHeatingType} onValueChange={(v) => setWaterHeatingType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="naturalGas">Natural Gas</SelectItem>
                <SelectItem value="electric">Electric</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Appliance Toggles */}
        <div className="flex flex-wrap gap-6 pt-2">
          <div className="flex items-center gap-2">
            <Switch checked={includeRange} onCheckedChange={setIncludeRange} id="range" />
            <Label htmlFor="range" className="text-sm cursor-pointer">
              Tenant provides Range
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={includeRefrigerator} onCheckedChange={setIncludeRefrigerator} id="fridge" />
            <Label htmlFor="fridge" className="text-sm cursor-pointer">
              Tenant provides Refrigerator
            </Label>
          </div>
        </div>

        {/* Breakdown */}
        <div className="border border-border rounded-lg divide-y divide-border">
          {breakdown.map((item, i) => (
            <div key={i} className="flex justify-between items-center px-4 py-2">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="font-mono text-sm">${item.value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center px-4 py-3 bg-primary/10">
            <span className="font-medium">Total Utility Allowance</span>
            <span className="font-mono font-semibold text-primary text-lg">${total}</span>
          </div>
        </div>

        {/* Link to full table */}
        <div className="pt-2">
          <Button variant="outline" size="sm" asChild>
            <a 
              href="https://www.hud.gov/sites/dfiles/PIH/documents/HUD-52667.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View Full HUD Utility Schedule (Form 52667)
            </a>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Source: HASLC Single Family Section 8 Utility Allowance Schedule, effective 01/01/2025.
        </p>
      </CardContent>
    </Card>
  );
};

export default UtilityAllowanceCalculator;
