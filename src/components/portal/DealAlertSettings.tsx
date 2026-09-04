import { useEffect, useState } from "react";
import { Bell, BellRing, Loader2, Save, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  disablePushOnThisDevice,
  enablePushOnThisDevice,
  isPushEnabledOnThisDevice,
  needsInstallFirst,
  pushSupported,
} from "@/lib/pushNotifications";

const STRATEGIES = ["Flip", "BRRRR", "Turnkey"];
const SOURCES = ["MLS", "WHOLESALER"];

export default function DealAlertSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [zips, setZips] = useState("");
  const [minBeds, setMinBeds] = useState("");
  const [strategies, setStrategies] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);

  const [deviceOn, setDeviceOn] = useState(false);
  const [deviceBusy, setDeviceBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const id = userData.user?.id ?? null;
      setUserId(id);

      if (id) {
        const { data } = await supabase
          .from("alert_preferences")
          .select("*")
          .eq("user_id", id)
          .maybeSingle();

        if (data) {
          setPushEnabled(data.push_enabled);
          setSmsEnabled(data.sms_enabled);
          setEmailEnabled(data.email_enabled);
          setMinPrice(data.min_price?.toString() ?? "");
          setMaxPrice(data.max_price?.toString() ?? "");
          setZips((data.zip_codes ?? []).join(", "));
          setMinBeds(data.min_beds?.toString() ?? "");
          setStrategies(data.strategies ?? []);
          setSources(data.sources ?? []);
        }
      }

      setDeviceOn(await isPushEnabledOnThisDevice());
      setLoading(false);
    })();
  }, []);

  const toggleIn = (list: string[], value: string, set: (v: string[]) => void) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("alert_preferences").upsert(
      {
        user_id: userId,
        push_enabled: pushEnabled,
        sms_enabled: smsEnabled,
        email_enabled: emailEnabled,
        min_price: minPrice ? Number(minPrice) : null,
        max_price: maxPrice ? Number(maxPrice) : null,
        min_beds: minBeds ? Number(minBeds) : null,
        zip_codes: zips
          .split(",")
          .map((z) => z.trim())
          .filter(Boolean),
        strategies,
        sources,
      },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) toast.error("Couldn't save your alert settings.");
    else toast.success("Alert settings saved.");
  };

  const handleDeviceToggle = async () => {
    setDeviceBusy(true);
    if (deviceOn) {
      await disablePushOnThisDevice();
      setDeviceOn(false);
      toast.success("Pop-up alerts turned off on this device.");
    } else {
      const result = await enablePushOnThisDevice();
      if (result.ok) {
        setDeviceOn(true);
        toast.success("Pop-up alerts are on for this device.");
      } else {
        toast.error(result.reason);
      }
    }
    setDeviceBusy(false);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading your alert settings...
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-card space-y-6">
      <div className="flex items-start gap-3">
        <BellRing className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <h2 className="font-medium text-foreground">Your deal alerts</h2>
          <p className="text-sm text-muted-foreground">
            Tell us what you're buying and we'll only alert you on matching deals.
          </p>
        </div>
      </div>

      {/* This device */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Smartphone className="w-4 h-4 text-muted-foreground mt-1" />
            <div>
              <p className="text-sm font-medium text-foreground">Pop-up alerts on this device</p>
              <p className="text-xs text-muted-foreground">
                {pushSupported()
                  ? "Get a notification on your phone or computer the moment a matching deal is posted."
                  : "This browser can't show pop-up alerts."}
              </p>
            </div>
          </div>
          <Button
            variant={deviceOn ? "outline" : "default"}
            size="sm"
            onClick={handleDeviceToggle}
            disabled={deviceBusy || !pushSupported()}
          >
            {deviceBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : deviceOn ? (
              "Turn off"
            ) : (
              "Turn on"
            )}
          </Button>
        </div>
        {needsInstallFirst() && (
          <p className="text-xs text-muted-foreground">
            On iPhone: tap Share → Add to Home Screen, then open the app from your home screen to
            turn pop-up alerts on.
          </p>
        )}
      </div>

      {/* Channels */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <Label htmlFor="alert-push" className="text-sm">Pop-up alerts</Label>
          <Switch id="alert-push" checked={pushEnabled} onCheckedChange={setPushEnabled} />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <Label htmlFor="alert-sms" className="text-sm">Text messages</Label>
          <Switch id="alert-sms" checked={smsEnabled} onCheckedChange={setSmsEnabled} />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <Label htmlFor="alert-email" className="text-sm">Email</Label>
          <Switch id="alert-email" checked={emailEnabled} onCheckedChange={setEmailEnabled} />
        </div>
      </div>

      {/* Criteria */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="alert-min" className="text-xs">Minimum price</Label>
          <Input
            id="alert-min"
            inputMode="numeric"
            placeholder="Any"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="alert-max" className="text-xs">Maximum price</Label>
          <Input
            id="alert-max"
            inputMode="numeric"
            placeholder="Any"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="alert-beds" className="text-xs">Minimum bedrooms</Label>
          <Input
            id="alert-beds"
            inputMode="numeric"
            placeholder="Any"
            value={minBeds}
            onChange={(e) => setMinBeds(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="alert-zips" className="text-xs">ZIP codes</Label>
          <Input
            id="alert-zips"
            placeholder="All areas"
            value={zips}
            onChange={(e) => setZips(e.target.value)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Strategies</Label>
          <div className="flex flex-wrap gap-2">
            {STRATEGIES.map((s) => (
              <Badge
                key={s}
                variant={strategies.includes(s) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleIn(strategies, s, setStrategies)}
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Deal sources</Label>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <Badge
                key={s}
                variant={sources.includes(s) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleIn(sources, s, setSources)}
              >
                {s === "MLS" ? "MLS" : "Wholesaler"}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Bell className="w-3 h-3" /> Leave a field blank to receive every matching deal.
        </p>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save alert settings
        </Button>
      </div>
    </div>
  );
}
