import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { STL_ZIP_CODES, COUNTIES } from "@/data/stlZipCodes";

interface ZipComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function ZipCombobox({ 
  value, 
  onValueChange, 
  placeholder = "Select ZIP code...",
  required 
}: ZipComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedZip = useMemo(() => {
    return STL_ZIP_CODES.find(z => z.zip === value);
  }, [value]);

  // Group ZIP codes by county
  const zipsByCounty = useMemo(() => {
    return COUNTIES.map(county => ({
      county,
      zips: STL_ZIP_CODES.filter(z => z.county === county),
    }));
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-required={required}
          className="w-full justify-between font-normal"
        >
          {selectedZip ? (
            <span>{selectedZip.zip}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Type ZIP code..." />
          <CommandList>
            <CommandEmpty>No ZIP code found.</CommandEmpty>
            {zipsByCounty.map(({ county, zips }) => (
              <CommandGroup key={county} heading={county}>
                {zips.map((zipInfo) => (
                  <CommandItem
                    key={zipInfo.zip}
                    value={zipInfo.zip}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === zipInfo.zip ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {zipInfo.zip}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
