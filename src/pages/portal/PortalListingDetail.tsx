import { useParams } from "react-router-dom";

const PortalListingDetail = () => {
  const { mlsNumber } = useParams<{ mlsNumber: string }>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Listing {mlsNumber}</h1>
      <p className="text-muted-foreground">Full listing detail page — coming soon.</p>
    </div>
  );
};

export default PortalListingDetail;
