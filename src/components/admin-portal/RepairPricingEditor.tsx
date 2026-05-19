import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { PricingRules } from "@/lib/repairPricing";

type NumericKey = Exclude<keyof PricingRules, "appliances">;

const FIELDS: Array<{ key: NumericKey; label: string; group: string }> = [
  // Kitchen
  { key: "cabinet_paint_each", label: "Cabinet paint (each)", group: "Kitchen" },
  { key: "cabinet_replace_each", label: "Cabinet replace (each)", group: "Kitchen" },
  { key: "countertop_replace_kitchen", label: "Countertop replacement (kitchen)", group: "Kitchen" },
  { key: "kitchen_light_fixtures", label: "Kitchen light rehab fixtures", group: "Kitchen" },
  { key: "kitchen_fallback_replace", label: "Kitchen fallback (unknown cabs)", group: "Kitchen" },
  // Baths
  { key: "bath_tub_glaze", label: "Tub/surround glaze", group: "Baths" },
  { key: "bath_tub_replace", label: "Tub/surround replace", group: "Baths" },
  { key: "bath_toilet_replace", label: "Toilet replace", group: "Baths" },
  { key: "bath_vanity_replace", label: "Vanity replace", group: "Baths" },
  { key: "bath_vanity_light", label: "Vanity light", group: "Baths" },
  { key: "bath_fan", label: "Bath fan", group: "Baths" },
  // Whole-house finishes
  { key: "flooring_per_sqft", label: "Flooring $/sqft", group: "Finishes" },
  { key: "paint_per_sqft", label: "Interior paint $/sqft", group: "Finishes" },
  { key: "interior_door_each", label: "Interior door (each)", group: "Finishes" },
  // Systems
  { key: "roof_per_square", label: "Roof $/square", group: "Systems" },
  { key: "roof_overhead_multiplier", label: "Roof overhead multiplier", group: "Systems" },
  { key: "hvac_replace", label: "HVAC replace", group: "Systems" },
  { key: "hvac_repair_reserve", label: "HVAC repair reserve", group: "Systems" },
  { key: "water_heater_replace", label: "Water heater replace", group: "Systems" },
  { key: "electrical_panel_replace", label: "Electrical panel/mast", group: "Systems" },
  { key: "plumbing_stack_replace", label: "Plumbing stack replace", group: "Systems" },
  { key: "window_each", label: "Window (each)", group: "Systems" },
  // Foundation
  { key: "foundation_vertical_crack_each", label: "Vertical crack (each)", group: "Foundation" },
  { key: "foundation_lateral_replace", label: "Lateral/horizontal crack", group: "Foundation" },
  { key: "drain_tile_system", label: "Perimeter drain tile + sump", group: "Foundation" },
  // Cleanout / exterior
  { key: "dumpster_each", label: "Dumpster (each)", group: "Cleanout / Exterior" },
  { key: "landscaping_light", label: "Landscaping light", group: "Cleanout / Exterior" },
  { key: "landscaping_overgrown", label: "Landscaping overgrown", group: "Cleanout / Exterior" },
  { key: "landscaping_severe", label: "Landscaping severe", group: "Cleanout / Exterior" },
  { key: "siding_per_sqft", label: "Vinyl siding $/sqft (house)", group: "Cleanout / Exterior" },
  { key: "gutters_replace", label: "Gutters replace", group: "Cleanout / Exterior" },
  { key: "garage_door_replace", label: "Garage door replace", group: "Cleanout / Exterior" },
  { key: "driveway_overlay", label: "Asphalt driveway overlay", group: "Cleanout / Exterior" },
  // Reserves
  { key: "misc_reserve_pct", label: "Misc reserve % (e.g. 0.10)", group: "Reserves" },
  // Gut
  { key: "gut_per_sqft_partial", label: "Gut $/sqft (partial)", group: "Gut" },
  { key: "gut_per_sqft_high", label: "Gut $/sqft (high)", group: "Gut" },
];

const APPLIANCE_KEYS = ["stove", "fridge", "microwave", "dishwasher"] as const;

const RepairPricingEditor = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<PricingRules | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("repair_pricing_rules")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
      if (data) {
        setRules(data.rules as unknown as PricingRules);
        setVersion(data.version);
      }
      setLoading(false);
    })();
  }, []);

  const setField = (key: NumericKey, value: number) => {
    setRules((prev) => (prev ? ({ ...prev, [key]: value } as PricingRules) : prev));
  };
  const setAppliance = (k: typeof APPLIANCE_KEYS[number], value: number) => {
    setRules((prev) => prev ? { ...prev, appliances: { ...prev.appliances, [k]: value } } : prev);
  };

  const handleSave = async () => {
    if (!rules) return;
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("admin-update-repair-pricing", {
      body: { rules },
    });
    setSaving(false);
    if (error || data?.error) {
      toast({ title: "Save failed", description: error?.message || data?.error || "Unknown", variant: "destructive" });
      return;
    }
    setVersion(data.version);
    toast({ title: "Pricing saved", description: `New version ${data.version} active. Future analyses will use it.` });
  };

  if (loading) {
    return <Card><CardContent className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></CardContent></Card>;
  }

  if (!rules) {
    return <Card><CardContent className="py-8 text-muted-foreground">No active pricing rules found.</CardContent></Card>;
  }

  const groups = Array.from(new Set(FIELDS.map((f) => f.group)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Repair Pricing Library
          <span className="text-xs font-normal text-muted-foreground">Active version: v{version}</span>
        </CardTitle>
        <CardDescription>
          Edits apply to future analyses only. Existing analyses are not retroactively updated.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {groups.map((g) => (
          <div key={g}>
            <h4 className="text-sm font-medium mb-2">{g}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {FIELDS.filter((f) => f.group === g).map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={(rules[f.key] as number) ?? 0}
                    onChange={(e) => setField(f.key, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div>
          <h4 className="text-sm font-medium mb-2">Appliances</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {APPLIANCE_KEYS.map((k) => (
              <div key={k} className="space-y-1">
                <Label className="text-xs capitalize">{k}</Label>
                <Input
                  type="number"
                  value={rules.appliances[k] ?? 0}
                  onChange={(e) => setAppliance(k, Number(e.target.value))}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save new version
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RepairPricingEditor;
