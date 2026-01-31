import { PlayCircle, User } from "lucide-react";

const SellFastVideo = () => {
  return (
    <section className="py-16 px-6 bg-background">
      <div className="container mx-auto max-w-3xl">
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-card">
          {/* Video Placeholder */}
          <div className="aspect-video bg-muted flex items-center justify-center relative">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <PlayCircle className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Video: Understanding Your AS-IS Selling Options
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                (2-4 minute overview coming soon)
              </p>
            </div>
          </div>

          {/* Video Description */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">A Personal Message</p>
                <p className="text-xs text-muted-foreground">From Integrity Realty STL</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We know that selling under time pressure or stressful circumstances can 
              feel overwhelming. In this video, we'll explain your options clearly: 
              listing AS-IS on the MLS for broader exposure, or accepting a cash offer 
              for speed and simplicity. We'll also be upfront about how we make money 
              on cash purchases—because you deserve to understand everyone's incentives.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SellFastVideo;
