export function shapePublicListing<T extends { raw?: unknown }>(listing: T): Omit<T, "raw"> {
  const displayListing = { ...listing };
  delete displayListing.raw;
  return displayListing;
}

export function shapeSingleListing<T extends { raw?: unknown }>(listing: T, isPublic: boolean): T | Omit<T, "raw"> {
  return isPublic ? shapePublicListing(listing) : listing;
}

export function listingServiceError(status: number): { error: string } {
  return { error: `Listing service returned ${status}` };
}

export type ListingRequestAccess = "anonymous" | "authenticated" | "unauthorized";

export async function resolveListingRequestAccess(
  isPublicSingleLookup: boolean,
  authorization: string,
  publishableKey: string,
  verifyUser: (token: string) => Promise<boolean>,
): Promise<ListingRequestAccess> {
  if (!authorization.startsWith("Bearer ")) {
    return isPublicSingleLookup ? "anonymous" : "unauthorized";
  }

  const token = authorization.slice("Bearer ".length);
  if (isPublicSingleLookup && token === publishableKey) return "anonymous";

  try {
    if (await verifyUser(token)) return "authenticated";
  } catch {
    if (isPublicSingleLookup) return "anonymous";
  }
  return isPublicSingleLookup ? "anonymous" : "unauthorized";
}
