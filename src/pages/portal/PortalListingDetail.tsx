import { useParams, Navigate } from "react-router-dom";

const PortalListingDetail = () => {
  const { mlsNumber } = useParams<{ mlsNumber: string }>();
  return <Navigate to={`/listing/${mlsNumber}`} state={{ fromPortal: true }} replace />;
};

export default PortalListingDetail;
