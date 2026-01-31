import { useState } from "react";
import { User, Mail, Phone, Lock, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const PortalAccount = () => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Mock user data
  const [profile, setProfile] = useState({
    name: "John Investor",
    email: "john@example.com",
    phone: "(314) 555-1234",
  });

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({
      title: "Profile Updated",
      description: "Your contact information has been saved.",
    });
    setIsUpdating(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.new !== password.confirm) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    setIsUpdating(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({
      title: "Password Changed",
      description: "Your password has been updated.",
    });
    setPassword({ current: "", new: "", confirm: "" });
    setIsUpdating(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">
          Account Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile information and password.
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-serif text-xl text-foreground">Contact Information</h2>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="mt-1 pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="mt-1 pl-9"
              />
            </div>
          </div>

          <Button type="submit" disabled={isUpdating}>
            <Save className="w-4 h-4 mr-2" />
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-serif text-xl text-foreground">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={password.current}
              onChange={(e) => setPassword({ ...password, current: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={password.new}
              onChange={(e) => setPassword({ ...password, new: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={password.confirm}
              onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
              className="mt-1"
            />
          </div>

          <Button type="submit" disabled={isUpdating}>
            <Lock className="w-4 h-4 mr-2" />
            {isUpdating ? "Updating..." : "Change Password"}
          </Button>
        </form>
      </div>

      {/* Agreement Status */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-xl text-foreground">Agreement Status</h2>
            <p className="text-sm text-muted-foreground">
              Your representation agreement is active.
            </p>
          </div>
        </div>
        <div className="bg-accent/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Exclusive Buyer Agency Agreement:</strong>{" "}
            Signed January 1, 2024 — Valid through December 31, 2024
          </p>
        </div>
      </div>

      {/* Notice */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Note:</strong> You cannot change your role 
          classification or access other investors' data. Contact us if you need to update 
          your agreement or have questions about your account.
        </p>
      </div>
    </div>
  );
};

export default PortalAccount;
