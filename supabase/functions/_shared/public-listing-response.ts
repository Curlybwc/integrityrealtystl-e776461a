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
