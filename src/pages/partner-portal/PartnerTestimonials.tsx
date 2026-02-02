import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star, Plus, Trash2 } from "lucide-react";

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  date: string;
}

const PartnerTestimonials = () => {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([
    {
      id: "1",
      quote: "Great work on our kitchen rehab. Completed on time and within budget!",
      author: "John D., Investor",
      date: "2024",
    },
  ]);
  
  const [newTestimonial, setNewTestimonial] = useState({
    quote: "",
    author: "",
    date: new Date().getFullYear().toString(),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimonial.quote || !newTestimonial.author) {
      toast({
        title: "Missing information",
        description: "Please fill in both the quote and author name.",
        variant: "destructive",
      });
      return;
    }

    setTestimonials([
      ...testimonials,
      {
        id: Date.now().toString(),
        ...newTestimonial,
      },
    ]);
    setNewTestimonial({ quote: "", author: "", date: new Date().getFullYear().toString() });
    toast({
      title: "Testimonial added",
      description: "Your testimonial will appear on your profile.",
    });
  };

  const handleDelete = (id: string) => {
    setTestimonials(testimonials.filter((t) => t.id !== id));
    toast({
      title: "Testimonial removed",
      description: "The testimonial has been deleted.",
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">
          Testimonials
        </h1>
        <p className="text-muted-foreground text-sm">
          Add client testimonials to build trust with investors viewing your profile.
        </p>
      </div>

      {/* Add New Testimonial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add Testimonial
          </CardTitle>
          <CardDescription>
            Add quotes from satisfied clients or investors you've worked with.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quote">Client Quote</Label>
              <Textarea
                id="quote"
                rows={3}
                placeholder="What did your client say about your work?"
                value={newTestimonial.quote}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, quote: e.target.value })}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author">Client Name</Label>
                <Input
                  id="author"
                  placeholder="e.g., John D., Investor"
                  value={newTestimonial.author}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, author: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Year</Label>
                <Input
                  id="date"
                  placeholder="2024"
                  value={newTestimonial.date}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, date: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit">Add Testimonial</Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Testimonials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Your Testimonials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {testimonials.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No testimonials yet. Add your first one above!
            </p>
          ) : (
            testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-muted/30 rounded-lg p-4 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                  <p className="text-sm mt-2 font-medium">
                    — {testimonial.author}
                    {testimonial.date && (
                      <span className="text-muted-foreground font-normal"> ({testimonial.date})</span>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(testimonial.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Changes are stored locally for demo purposes. 
            Full persistence requires backend integration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerTestimonials;
