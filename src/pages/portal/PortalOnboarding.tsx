import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Circle, Phone, ShieldCheck, FileSignature, Loader2, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAccessTier } from "@/hooks/useAccessTier";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const SMS_CONSENT_TEXT =
  "I agree to receive deal alerts and transaction-related text messages from Integrity Realty STL. Msg & data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of any purchase.";
const EMAIL_CONSENT_TEXT =
  "I agree to receive deal alerts, market updates, and transaction-related emails from Integrity Realty STL. I can unsubscribe at any time.";

const portals = ["investor", "wholesaler", "partner"] as const;
type Portal = (typeof portals)[number];

const PortalOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const params = useParams();
  // Derive portal from current path: /portal/<portal>/onboarding
  const portal: Portal =
    portals.find((p) => window.location.pathname.startsWith(`/portal/${p}`)) ?? "investor";

  const { profile, tier, isBuyerSide, refresh, contactComplete, loading: tierLoading } =
    useAccessTier();

  const [phone, setPhone] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone ?? "");
      setSmsOptIn(profile.sms_opt_in);
      setEmailOptIn(profile.email_opt_in);
    }
  }, [profile]);

  const baaStatus = profile?.baa_status ?? "not_required";
  const baaDone = ["signed", "verified"].includes(baaStatus);

  const saveContactInfo = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast({ title: "Phone required", description: "Enter a valid 10-digit US number.", variant: "destructive" });
      return;
    }
    if (!smsOptIn || !emailOptIn) {
      toast({
        title: "Both opt-ins required",
        description: "You must opt in to both SMS and email alerts to use the portal.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id;
    if (!uid) {
      toast({ title: "Not signed in", variant: "destructive" });
      setSaving(false);
      return;
    }

    const now = new Date().toISOString();
    const prevSms = profile?.sms_opt_in ?? false;
    const prevEmail = profile?.email_opt_in ?? false;

    // Normalize phone to E.164-ish (+1XXXXXXXXXX)
    const normalized = digits.length === 11 && digits.startsWith("1") ? `+${digits}` : `+1${digits}`;

    const { error: profErr } = await supabase
      .from("profiles")
      .update({
        phone: normalized,
        sms_opt_in: smsOptIn,
        sms_opt_in_at: prevSms === smsOptIn ? undefined : now,
        email_opt_in: emailOptIn,
        email_opt_in_at: prevEmail === emailOptIn ? undefined : now,
      })
      .eq("id", uid);

    if (profErr) {
      toast({ title: "Save failed", description: profErr.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Append consent log entries for any changes
    const consentRows: Array<{
      user_id: string;
      consent_type: "sms" | "email";
      granted: boolean;
      consent_text: string;
      user_agent: string;
    }> = [];
    if (prevSms !== smsOptIn) {
      consentRows.push({
        user_id: uid,
        consent_type: "sms",
        granted: smsOptIn,
        consent_text: SMS_CONSENT_TEXT,
        user_agent: navigator.userAgent.slice(0, 500),
      });
    }
    if (prevEmail !== emailOptIn) {
      consentRows.push({
        user_id: uid,
        consent_type: "email",
        granted: emailOptIn,
        consent_text: EMAIL_CONSENT_TEXT,
        user_agent: navigator.userAgent.slice(0, 500),
      });
    }
    if (consentRows.length > 0) {
      // Insert via edge function so IP can be captured server-side (optional best-effort).
      void supabase.functions.invoke("log-consent", { body: { entries: consentRows } });
    }

    toast({ title: "Saved", description: "Your contact preferences are updated." });
    await refresh();
    setSaving(false);
    if (isBuyerSide && !baaDone) {
      setStep(2);
    } else {
      navigate(`/portal/${portal}`);
    }
  };

  if (tierLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="font-serif text-3xl text-foreground mb-2">Complete Your Profile</h1>
        <p className="text-muted-foreground text-sm">
          {tier === "full"
            ? "You're all set — you have full portal access."
            : "Finish a few quick steps to unlock the full portal."}
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-3">
        <StepBadge n={1} active={step === 1} done={contactComplete} label="Contact & Consents" />
        {isBuyerSide && (
          <>
            <div className="w-12 h-px bg-border" />
            <StepBadge n={2} active={step === 2} done={baaDone} label="Sign BAA" />
          </>
        )}
      </div>

      {/* Step 1: Contact + consents */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="w-5 h-5 text-primary" /> Contact & Communication
            </CardTitle>
            <CardDescription>
              We use these to send you deal alerts and transaction updates. Both opt-ins are required to
              access portal tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone">Cell phone (SMS-capable) *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(314) 555-0123"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Must be a mobile number that can receive text messages.
              </p>
            </div>

            <ConsentRow
              icon={<ShieldCheck className="w-4 h-4 text-primary" />}
              checked={smsOptIn}
              onChange={setSmsOptIn}
              text={SMS_CONSENT_TEXT}
            />
            <ConsentRow
              icon={<Mail className="w-4 h-4 text-primary" />}
              checked={emailOptIn}
              onChange={setEmailOptIn}
              text={EMAIL_CONSENT_TEXT}
            />

            <Button onClick={saveContactInfo} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isBuyerSide ? "Save & continue" : "Save & finish"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: BAA (investor only) */}
      {step === 2 && isBuyerSide && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSignature className="w-5 h-5 text-primary" /> Buyer's Agency Agreement
            </CardTitle>
            <CardDescription>
              Missouri law requires a signed Buyer's Agency Agreement before we can represent you in a
              transaction. We'll send it to you through Dotloop for e-signature.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BaaStatusBlock status={baaStatus} />

            {baaStatus === "not_sent" && (
              <SendBaaBlock onSent={refresh} />
            )}

            {baaStatus === "sent" && (
              <div className="bg-accent/40 border border-border rounded-md p-4 text-sm space-y-2">
                <p className="font-medium text-foreground">Check your email</p>
                <p className="text-muted-foreground text-xs">
                  We've sent your Buyer's Agency Agreement via Dotloop. Sign it from the email and this
                  page will update once verified. Didn't get it? You can resend below.
                </p>
                <SendBaaBlock onSent={refresh} resend />
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={() => navigate(`/portal/${portal}`)}>
              Back to portal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const SendBaaBlock = ({ onSent, resend = false }: { onSent: () => Promise<void>; resend?: boolean }) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    const res = await supabase.functions.invoke("dotloop-send-baa", { body: {} });
    const data = res.data as { error?: string; detail?: string; ok?: boolean } | null;
    if (res.error || data?.error) {
      toast({
        title: data?.error || "Could not send BAA",
        description:
          data?.detail ||
          res.error?.message ||
          "Please try again in a moment or contact our team.",
        variant: "destructive",
      });
    } else {
      toast({
        title: resend ? "BAA resent" : "BAA sent",
        description: "Check your email from Dotloop to sign the agreement.",
      });
      await onSent();
    }
    setSending(false);
  };

  if (resend) {
    return (
      <Button size="sm" variant="outline" disabled={sending} onClick={send}>
        {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Resend BAA
      </Button>
    );
  }

  return (
    <div className="bg-accent/40 border border-border rounded-md p-4 text-sm space-y-2">
      <p className="font-medium text-foreground">Send your Buyer's Agency Agreement</p>
      <p className="text-muted-foreground text-xs">
        We'll email the agreement to you through Dotloop for e-signature. Once signed, your account is
        upgraded to full access.
      </p>
      <Button size="sm" disabled={sending} onClick={send}>
        {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Send my BAA via Dotloop
      </Button>
    </div>
  );
};

const StepBadge = ({
  n,
  active,
  done,
  label,
}: {
  n: number;
  active: boolean;
  done: boolean;
  label: string;
}) => (
  <div className="flex items-center gap-2">
    <div
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2",
        done
          ? "bg-primary text-primary-foreground border-primary"
          : active
          ? "border-primary text-primary"
          : "border-border text-muted-foreground"
      )}
    >
      {done ? <CheckCircle2 className="w-4 h-4" /> : n}
    </div>
    <span className={cn("text-sm", active || done ? "text-foreground" : "text-muted-foreground")}>
      {label}
    </span>
  </div>
);

const ConsentRow = ({
  icon,
  checked,
  onChange,
  text,
}: {
  icon: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  text: string;
}) => (
  <label className="flex items-start gap-3 p-3 border border-border rounded-md cursor-pointer hover:bg-accent/30 transition-colors">
    <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="mt-0.5" />
    <div className="flex-1 text-xs text-muted-foreground space-y-1">
      <div className="flex items-center gap-1.5 text-foreground font-medium">
        {icon} Required consent
      </div>
      <p>{text}</p>
    </div>
  </label>
);

const BaaStatusBlock = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; tone: string }> = {
    not_required: { label: "Not required for your account type", tone: "text-muted-foreground" },
    not_sent: { label: "Not yet sent", tone: "text-amber-600" },
    sent: { label: "Sent — awaiting your signature in Dotloop", tone: "text-amber-600" },
    signed: { label: "Signed — full access unlocked", tone: "text-primary" },
    verified: { label: "Signed & verified — full access", tone: "text-primary" },
  };
  const s = map[status] ?? map.not_sent;
  return (
    <div className="flex items-center gap-2 text-sm">
      {status === "signed" || status === "verified" ? (
        <CheckCircle2 className="w-4 h-4 text-primary" />
      ) : (
        <Circle className="w-4 h-4 text-muted-foreground" />
      )}
      <span className={s.tone}>BAA status: {s.label}</span>
    </div>
  );
};

export default PortalOnboarding;
