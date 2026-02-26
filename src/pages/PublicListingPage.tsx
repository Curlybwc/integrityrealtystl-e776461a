import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import ListingDetailBase, { type RawListing } from "@/components/listing/ListingDetailBase";

const PublicListingPage = () => {
  const navigate = useNavigate();
  const { mlsNumber } = useParams<{ mlsNumber: string }>();

  const goBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const { data: listing, isLoading, error } = useQuery<RawListing | null>({
    queryKey: ["mls-listing", mlsNumber],
    queryFn: async () => {
      const { data, error: fnError } = await supabase.functions.invoke(
        "fetch-mls-listings",
        { body: { mlsNumber } }
      );
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      return data?.listings?.[0] ?? null;
    },
    enabled: !!mlsNumber,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error || !listing) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <Button variant="ghost" size="sm" className="gap-1" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" /> Back to Results
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {error ? `Error: ${(error as Error).message}` : "Listing not found."}
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ListingDetailBase listing={listing} onBack={goBack} />
    </Layout>
  );
};

export default PublicListingPage;
