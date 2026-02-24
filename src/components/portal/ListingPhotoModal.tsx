import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ListingPhotoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: string[];
  address: string;
}

const ListingPhotoModal = ({ open, onOpenChange, photos, address }: ListingPhotoModalProps) => {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c > 0 ? c - 1 : photos.length - 1));
  const next = () => setCurrent((c) => (c < photos.length - 1 ? c + 1 : 0));

  if (photos.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-sm truncate">{address}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <AspectRatio ratio={16 / 10}>
            <img
              src={photos[current]}
              alt={`${address} photo ${current + 1}`}
              className="w-full h-full object-cover rounded-md"
            />
          </AspectRatio>
          {photos.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                onClick={prev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                onClick={next}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {current + 1} / {photos.length}
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ListingPhotoModal;
