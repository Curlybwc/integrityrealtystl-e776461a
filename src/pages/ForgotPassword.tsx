import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSent(true);
      toast({
        title: "Check your email",
        description: "We sent you a password reset link.",
      });
    }

    setIsLoading(false);
  };

  return (
    <Layout>
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Reset Password
            </h1>
            <p className="text-muted-foreground">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 shadow-card">
            {sent ? (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  If an account exists for <strong>{email}</strong>, you'll receive a reset link shortly.
                </p>
                <Link to="/login" className="text-primary hover:underline text-sm">
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <Link to="/login" className="text-primary hover:underline">
                    Back to Login
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ForgotPassword;
