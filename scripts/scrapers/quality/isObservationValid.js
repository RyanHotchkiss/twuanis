function isObservationValid(row) {
  return Boolean(
    row &&
    row.source_name &&
    row.source_listing_id &&
    row.source_url
  )
}

module.exports = {
  isObservationValid
}
