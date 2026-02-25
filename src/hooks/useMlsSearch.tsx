import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MlsSearchParams {
  mlsNumber?: string;
  city?: string;
  zip?: string;
  minPrice?: string;
  maxPrice?: string;
  minBeds?: string;
  maxBeds?: string;
  minBaths?: string;
  minSqft?: string;
  maxSqft?: string;
  status?: string;
  resultsPerPage?: string;
  pageNum?: string;
}

export interface MlsListing {
  mls_listing_id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: number;
  below_grade_sqft?: number;
  year_built?: number;
  property_type: string;
  list_price: number;
  mls_status: string;
  photo_urls: string[];
}

export interface MlsSearchResult {
  count: number;
  page: number;
  numPages: number;
  listings: MlsListing[];
}

export function useMlsSearch() {
  const [results, setResults] = useState<MlsSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const search = async (params: MlsSearchParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "fetch-mls-listings",
        { body: params }
      );

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setResults(data as MlsSearchResult);
      return data as MlsSearchResult;
    } catch (err: any) {
      const msg = err.message || "Failed to fetch MLS listings";
      setError(msg);
      toast({
        title: "MLS Search Error",
        description: msg,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setError(null);
  };

  return { results, isLoading, error, search, clearResults };
}
