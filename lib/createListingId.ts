export function createListingId(listing: any) {

  if (listing.id) {
    return String(listing.id)
  }

  if (listing.listing_url) {

    return listing.listing_url
      .replaceAll('https://', '')
      .replaceAll('http://', '')
      .replaceAll('/', '-')
      .replaceAll('?', '-')
      .replaceAll('&', '-')
      .replaceAll('=', '-')

  }

  return crypto.randomUUID()

}
