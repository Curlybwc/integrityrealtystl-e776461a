import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_SCREENING_CONFIG } from "@/lib/screening";

const AdminSettings = () => {
  const config = DEFAULT_SCREENING_CONFIG;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Configure screening thresholds and system parameters
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rehab Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rehab Rates ($/sqft)</CardTitle>
            <CardDescription>
              Cost per square foot for each rehab tier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Light</Label>
                <Input 
                  type="number" 
                  value={config.rehab_rate_light} 
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Medium</Label>
                <Input 
                  type="number" 
                  value={config.rehab_rate_medium} 
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Heavy</Label>
                <Input 
                  type="number" 
                  value={config.rehab_rate_heavy} 
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              These values are currently read-only in the mockup.
            </p>
          </CardContent>
        </Card>

        {/* Turnkey Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Turnkey Thresholds</CardTitle>
            <CardDescription>
              Criteria for passing Turnkey strategy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Min Rent-to-Price %</Label>
              <Input 
                type="number" 
                step="0.0001"
                value={config.turnkey_min_rtp} 
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                {(config.turnkey_min_rtp * 100).toFixed(2)}% minimum
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Price/ARV %</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={config.turnkey_min_arv_pct} 
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Price/ARV %</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={config.turnkey_max_arv_pct} 
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BRRRR Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">BRRRR Thresholds</CardTitle>
            <CardDescription>
              Criteria for passing BRRRR strategy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Min Rent-to-Price %</Label>
              <Input 
                type="number" 
                step="0.0001"
                value={config.brrrr_min_rtp} 
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                {(config.brrrr_min_rtp * 100).toFixed(2)}% minimum
              </p>
            </div>
            <div className="space-y-2">
              <Label>Max All-In % of ARV</Label>
              <Input 
                type="number" 
                step="0.01"
                value={config.brrrr_max_all_in_pct} 
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                (Price + Rehab) must be ≤ {(config.brrrr_max_all_in_pct * 100).toFixed(0)}% of ARV
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-lg text-amber-800">Mockup Notice</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-700">
            <p>
              This is a frontend mockup for export to GoHighLevel. The settings
              shown here are read-only placeholders. In the production system,
              these values would be stored in your database and editable by admins.
            </p>
            <p className="mt-2">
              Data is persisted to localStorage for demonstration purposes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
