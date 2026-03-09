import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const DEMO_EMAIL = "demo@partner.com";
const DEMO_PASSWORD = "demo123";

const PartnerLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      toast({
        title: "Welcome back!",
        description: "Redirecting to your dashboard...",
      });
      navigate("/portal/partner");
    } else {
      toast({
        title: "Invalid credentials",
        description: "Please check your email and password.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleDemoLogin = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  };

  return (
    <Layout>
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Partner Portal
            </h1>
            <p className="text-muted-foreground">
              Access your profile to update your business information, testimonials, and availability.
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-8 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com"
                  className="w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-dashed border-border">
              <p className="text-sm text-muted-foreground mb-2 text-center">
                Demo credentials:
              </p>
              <p className="text-xs text-muted-foreground text-center font-mono">
                {DEMO_EMAIL} / {DEMO_PASSWORD}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={handleDemoLogin}
              >
                Fill Demo Credentials
              </Button>
            </div>

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Want to join our network?{" "}
                <Link to="/network-partner" className="text-primary hover:underline">
                  Apply here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PartnerLogin;
