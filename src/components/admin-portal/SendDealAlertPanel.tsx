import { useState } from "react";
import { Loader2, Send, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDeals } from "@/hooks/useDeals";
import { formatCurrency } from "@/lib/screening";
import { toast } from "sonner";

const SendDealAlertPanel = () => {
  const { deals } = useDeals();
  const [sendingId, setSendingId] = useState<string | null>(null);

  const alertDeals = deals.filter((d) => d.flagged_for_alert && d.buyer_visible);

  const strategyOf = (deal: (typeof deals)[number]) => {
    if (deal.passes_flip) return "Flip";
    if (deal.passes_brrrr) return "BRRRR";
    if (deal.passes_turnkey) return "Turnkey";
    return undefined;
  };

  const handleSend = async (deal: (typeof deals)[number]) => {
    setSendingId(deal.id);
    const { data, error } = await supabase.functions.invoke("send-deal-alert", {
      body: {
        deal: {
          key: deal.id,
          address: deal.address,
          city: deal.city,
          zip: deal.zip,
          price: deal.list_price,
          beds: deal.beds,
          strategy: strategyOf(deal),
          source: deal.source_type,
          url: `/portal/investor/deals/${deal.id}`,
        },
      },
    });
    setSendingId(null);

    if (error) {
      toast.error("Couldn't send that alert. Please try again.");
      return;
    }

    const result = data as {
      recipients: number;
      push_sent: number;
      sms_sent: number;
      sms_configured?: boolean;
    };

    if (!result?.recipients) {
      toast.info("No investors currently match this deal's criteria.");
      return;
    }

    toast.success(
      `Alert sent to ${result.recipients} investor${result.recipients === 1 ? "" : "s"} — ` +
        `${result.push_sent} pop-up${result.push_sent === 1 ? "" : "s"}, ${result.sms_sent} text${
          result.sms_sent === 1 ? "" : "s"
        }.` + (result.sms_configured === false ? " Text messaging isn't set up yet." : ""),
    );
  };

  if (!alertDeals.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <Bell className="w-5 h-5 text-primary mt-0.5" />
        <div>
          <h2 className="font-medium text-foreground">Send deal alerts</h2>
          <p className="text-sm text-muted-foreground">
            Only investors whose saved criteria match the property will be notified.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {alertDeals.map((deal) => (
          <div
            key={deal.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{deal.address}</p>
              <p className="text-xs text-muted-foreground">
                {deal.city}, {deal.zip} · {formatCurrency(deal.list_price)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {deal.source_type === "WHOLESALER" ? "Wholesaler" : "MLS"}
              </Badge>
              <Button size="sm" onClick={() => handleSend(deal)} disabled={sendingId === deal.id}>
                {sendingId === deal.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send alert
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SendDealAlertPanel;
