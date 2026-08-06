export type ListingStateRecord = {
  id: string
}

export type ListingStateUpdater<
  Listing extends ListingStateRecord
> = (
  listing: Listing
) => Listing

export function findListingById<
  Listing extends ListingStateRecord
>(
  listings: readonly Listing[],
  listingId: string
): Listing | null {
  return (
    listings.find(
      listing =>
        listing.id === listingId
    ) ??
    null
  )
}

export function replaceListing<
  Listing extends ListingStateRecord
>(
  listings: readonly Listing[],
  canonicalListing: Listing
): Listing[] {
  let replaced = false

  const nextListings =
    listings.map(
      listing => {
        if (
          listing.id !==
          canonicalListing.id
        ) {
          return listing
        }

        replaced = true

        return canonicalListing
      }
    )

  return replaced
    ? nextListings
    : [
        canonicalListing,
        ...nextListings
      ]
}

export function updateListing<
  Listing extends ListingStateRecord
>(
  listings: readonly Listing[],
  listingId: string,
  updater:
    ListingStateUpdater<Listing>
): Listing[] {
  return listings.map(
    listing =>
      listing.id === listingId
        ? updater(listing)
        : listing
  )
}

export function patchListing<
  Listing extends ListingStateRecord
>(
  listings: readonly Listing[],
  listingId: string,
  patch:
    Partial<
      Omit<
        Listing,
        'id'
      >
    >
): Listing[] {
  return updateListing(
    listings,
    listingId,
    listing => ({
      ...listing,
      ...patch
    })
  )
}

export function prependListing<
  Listing extends ListingStateRecord
>(
  listings: readonly Listing[],
  listing: Listing
): Listing[] {
  return [
    listing,
    ...listings.filter(
      currentListing =>
        currentListing.id !==
        listing.id
    )
  ]
}

export function removeListing<
  Listing extends ListingStateRecord
>(
  listings: readonly Listing[],
  listingId: string
): Listing[] {
  return listings.filter(
    listing =>
      listing.id !== listingId
  )
}