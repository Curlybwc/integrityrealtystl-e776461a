import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin } from "lucide-react";

const Contact = () => {
  return (
    <Layout>
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6 text-center">
            Get in Touch
          </h1>
          <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-card border border-border rounded-lg p-8 shadow-card">
              <form className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" placeholder="(314) 555-0123" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us how we can help..." 
                    rows={5}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="font-serif text-2xl text-foreground mb-6">Contact Information</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <p className="text-muted-foreground">info@integrityrealtystl.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Phone</p>
                      <p className="text-muted-foreground">(314) 555-0123</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Location</p>
                      <p className="text-muted-foreground">St. Louis, Missouri</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-secondary/50 rounded-lg p-6">
                <h3 className="font-serif text-lg text-foreground mb-2">Office Hours</h3>
                <p className="text-sm text-muted-foreground">
                  Monday - Friday: 9:00 AM - 6:00 PM<br />
                  Saturday: By appointment<br />
                  Sunday: Closed
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
