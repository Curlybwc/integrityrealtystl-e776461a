import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { PricingRules } from "@/lib/repairPricing";

const FIELDS: Array<{ key: keyof PricingRules; label: string; group: string }> = [
  { key: "cost_per_cabinet", label: "Cost per cabinet", group: "Kitchen" },
  { key: "kitchen_fallback_replace", label: "Kitchen replace fallback", group: "Kitchen" },
  { key: "kitchen_light_rehab", label: "Kitchen light rehab", group: "Kitchen" },
  { key: "countertop_per_cabinet", label: "Countertop per cabinet", group: "Kitchen" },
  { key: "full_bath_replace", label: "Full bath replace", group: "Baths" },
  { key: "half_bath_replace", label: "Half bath replace", group: "Baths" },
  { key: "bath_partial", label: "Bath partial", group: "Baths" },
  { key: "bath_refresh", label: "Bath refresh", group: "Baths" },
  { key: "roof_per_square", label: "Roof $/square", group: "Systems" },
  { key: "roof_overhead_multiplier", label: "Roof overhead multiplier", group: "Systems" },
  { key: "hvac_replace", label: "HVAC replace", group: "Systems" },
  { key: "water_heater_replace", label: "Water heater replace", group: "Systems" },
  { key: "plumbing_stack_replace", label: "Plumbing stack replace", group: "Systems" },
  { key: "flooring_per_sqft", label: "Flooring $/sqft", group: "Finishes" },
  { key: "paint_drywall_per_sqft", label: "Paint/drywall $/sqft", group: "Finishes" },
  { key: "drywall_widespread_per_sqft", label: "Drywall widespread $/sqft", group: "Finishes" },
  { key: "window_replace_each", label: "Window replace each", group: "Finishes" },
  { key: "dumpster", label: "Dumpster", group: "Other" },
  { key: "foundation_reserve_monitor", label: "Foundation reserve (monitor)", group: "Reserves" },
  { key: "foundation_reserve_major", label: "Foundation reserve (major)", group: "Reserves" },
  { key: "basement_water_reserve_minor", label: "Basement water (minor)", group: "Reserves" },
  { key: "basement_water_reserve_major", label: "Basement water (major)", group: "Reserves" },
  { key: "landscaping_light", label: "Landscaping light", group: "Other" },
  { key: "landscaping_heavy", label: "Landscaping heavy", group: "Other" },
  { key: "misc_reserve", label: "Misc reserve", group: "Reserves" },
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

  const setField = (key: keyof PricingRules, value: number) => {
    setRules((prev) => prev ? { ...prev, [key]: value } as PricingRules : prev);
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
