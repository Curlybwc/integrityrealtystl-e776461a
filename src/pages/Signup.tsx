import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SMS_CONSENT_TEXT =
  "I agree to receive deal alerts and transaction-related text messages from Integrity Realty STL. Msg & data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of any purchase.";
const EMAIL_CONSENT_TEXT =
  "I agree to receive deal alerts, market updates, and transaction-related emails from Integrity Realty STL. I can unsubscribe at any time.";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast({ title: "Full name required", variant: "destructive" });
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast({
        title: "Valid cell phone required",
        description: "Enter a 10-digit US mobile number that can receive text messages.",
        variant: "destructive",
      });
      return;
    }
    if (!smsOptIn || !emailOptIn) {
      toast({
        title: "Both opt-ins required",
        description: "Please accept the SMS and email communication consents to create your account.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Password and confirm password must match.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const normalizedPhone =
      digits.length === 11 && digits.startsWith("1") ? `+${digits}` : `+1${digits}`;

    const { data: signupData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { full_name: fullName.trim() },
      },
    });

    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Update profile with phone + opt-ins. (Trigger created the row.)
    const uid = signupData.user?.id;
    if (uid) {
      const now = new Date().toISOString();
      await supabase
        .from("profiles")
        .update({
          phone: normalizedPhone,
          sms_opt_in: true,
          sms_opt_in_at: now,
          email_opt_in: true,
          email_opt_in_at: now,
        })
        .eq("id", uid);

      // Log consent (best-effort)
      void supabase.functions.invoke("log-consent", {
        body: {
          entries: [
            {
              user_id: uid,
              consent_type: "sms",
              granted: true,
              consent_text: SMS_CONSENT_TEXT,
              user_agent: navigator.userAgent.slice(0, 500),
            },
            {
              user_id: uid,
              consent_type: "email",
              granted: true,
              consent_text: EMAIL_CONSENT_TEXT,
              user_agent: navigator.userAgent.slice(0, 500),
            },
          ],
        },
      });
    }

    toast({ title: "Account created", description: "Redirecting to your portals..." });
    navigate("/portals");
    setIsLoading(false);
  };

  return (
    <Layout>
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Create Account
            </h1>
            <p className="text-muted-foreground">
              Sign up to access your available portals.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Cell Phone (SMS-capable) *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(314) 555-0123"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Required for deal alerts and transaction updates.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-border">
                <label className="flex items-start gap-2 text-xs cursor-pointer">
                  <Checkbox
                    checked={smsOptIn}
                    onCheckedChange={(v) => setSmsOptIn(!!v)}
                    className="mt-0.5"
                  />
                  <span className="text-muted-foreground leading-relaxed">{SMS_CONSENT_TEXT}</span>
                </label>
                <label className="flex items-start gap-2 text-xs cursor-pointer">
                  <Checkbox
                    checked={emailOptIn}
                    onCheckedChange={(v) => setEmailOptIn(!!v)}
                    className="mt-0.5"
                  />
                  <span className="text-muted-foreground leading-relaxed">{EMAIL_CONSENT_TEXT}</span>
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Signup;
