 function LimitedData({
      sampleSize,
      label
    }: {
      sampleSize: number
      label: string
    }) {
      return (
        <>
          <div>Limited data</div>
          <div style={secondaryValue}>
            Based on {sampleSize} {label}
          </div>
        </>
      )
    }


export default function PriceMeterResults({
  filters,
  analysis
    }: {
      filters: any
      analysis: any
    }) {
      const landSample =
        analysis.summary.landOnlySampleSize || 0

      const constructionSample =
        analysis.summary.constructionOnlySampleSize || 0

      const mixedSample =
        analysis.summary.mixedSampleSize || 0

      return (

            <section>
            
            <h2 style={sectionTitle}>
                Price per Square Meter Summary
            </h2>

            <div style={cardGrid}>
                  <StatCard
                    label="Average Price ÷ Land Area"
                    value={
                      analysis.summary.averagePricePerLandM2 ? (
                        <>
                          <div>{analysis.summary.averagePricePerLandM2}</div>
                          <div style={secondaryValue}>
                            {analysis.summary.averagePricePerLandFt2}
                          </div>
                          <div style={secondaryValue}>
                            Based on {landSample} listings with land area only
                          </div>
                        </>
                      ) : (
                        <LimitedData
                          sampleSize={landSample}
                          label="listings with land area only"
                        />
                      )
                    }
                  />

                  <StatCard
                    label="Median Price ÷ Land Area"
                    value={
                      analysis.summary.medianPricePerLandM2 ? (
                        <>
                          <div>{analysis.summary.medianPricePerLandM2}</div>
                          <div style={secondaryValue}>
                            {analysis.summary.medianPricePerLandFt2}
                          </div>
                          <div style={secondaryValue}>
                            Based on {landSample} listings with land area only
                          </div>
                        </>
                      ) : (
                        <LimitedData
                          sampleSize={landSample}
                          label="listings with land area only"
                        />
                      )
                    }
                  />

                  <StatCard
                    label="Average Price ÷ Construction Area"
                    value={
                      analysis.summary.averagePricePerConstructionM2 ? (
                        <>
                          <div>{analysis.summary.averagePricePerConstructionM2}</div>
                          <div style={secondaryValue}>
                            {analysis.summary.averagePricePerConstructionFt2}
                          </div>
                          <div style={secondaryValue}>
                            Based on {constructionSample} listings with construction area only
                          </div>
                        </>
                      ) : (
                        <LimitedData
                          sampleSize={constructionSample}
                          label="listings with construction area only"
                        />
                      )
                    }
                  />

                  <StatCard
                    label="Median Price ÷ Construction Area"
                    value={
                      analysis.summary.medianPricePerConstructionM2 ? (
                        <>
                          <div>{analysis.summary.medianPricePerConstructionM2}</div>
                          <div style={secondaryValue}>
                            {analysis.summary.medianPricePerConstructionFt2}
                          </div>
                          <div style={secondaryValue}>
                            Based on {constructionSample} listings with construction area only
                          </div>
                        </>
                      ) : (
                        <LimitedData
                          sampleSize={constructionSample}
                          label="listings with construction area only"
                        />
                      )
                    }
                  />

                  <StatCard
                      label="Mixed Listings: Average Price ÷ Land Area"
                      value={
                        analysis.summary.averageMixedPricePerLandM2 ? (
                          <>
                            <div>{analysis.summary.averageMixedPricePerLandM2}</div>
                            <div style={secondaryValue}>
                              {analysis.summary.averageMixedPricePerLandFt2}
                            </div>
                            <div style={secondaryValue}>
                              Based on {mixedSample} listings with land and construction area
                            </div>
                          </>
                        ) : (
                          <LimitedData
                            sampleSize={mixedSample}
                            label="mixed listings"
                          />
                        )
                      }
                    />

                  <StatCard
                      label="Mixed Listings: Median Price ÷ Land Area"
                      value={
                        analysis.summary.medianMixedPricePerLandM2 ? (
                          <>
                            <div>{analysis.summary.medianMixedPricePerLandM2}</div>
                            <div style={secondaryValue}>
                              {analysis.summary.medianMixedPricePerLandFt2}
                            </div>
                            <div style={secondaryValue}>
                              Based on {mixedSample} listings with land and construction area
                            </div>
                          </>
                        ) : (
                          <LimitedData
                            sampleSize={mixedSample}
                            label="listings with land and construction area"
                          />
                        )
                      }
                    />

                    <StatCard
                        label="Mixed Listings: Average Price ÷ Construction Area"
                        value={
                          analysis.summary.averageMixedPricePerConstructionM2 ? (
                            <>
                              <div>
                                {analysis.summary.averageMixedPricePerConstructionM2}
                              </div>
                              <div style={secondaryValue}>
                                {analysis.summary.averageMixedPricePerConstructionFt2}
                              </div>
                              <div style={secondaryValue}>
                                Based on {mixedSample} listings with land and construction area
                              </div>
                            </>
                          ) : (
                            <LimitedData
                              sampleSize={mixedSample}
                              label="listings with land and construction area"
                            />
                          )
                        }
                      />

                      <StatCard
                        label="Mixed Listings: Median Price ÷ Construction Area"
                        value={
                          analysis.summary.medianMixedPricePerConstructionM2 ? (
                            <>
                              <div>
                                {analysis.summary.medianMixedPricePerConstructionM2}
                              </div>
                              <div style={secondaryValue}>
                                {analysis.summary.medianMixedPricePerConstructionFt2}
                              </div>
                              <div style={secondaryValue}>
                                Based on {mixedSample} listings with land and construction area
                              </div>
                            </>
                          ) : (
                            <LimitedData
                              sampleSize={mixedSample}
                              label="listings with land and construction area"
                            />
                          )
                        }
                      />

                      <StatCard
                      label="Average Construction : Land Ratio"
                      value={
                        analysis.summary.averageMixedConstructionToLandRatio ? (
                          <>
                            <div>
                              {analysis.summary.averageMixedConstructionToLandRatio}
                            </div>
                            <div style={secondaryValue}>
                              On average, the construction area equals{' '}
                              {analysis.summary.averageMixedConstructionToLandRatio} of the
                              property area.
                            </div>
                          </>
                        ) : (
                          'N/A'
                        )
                      }
                    />

                    <StatCard
                      label="Median Construction : Land Ratio"
                      value={
                        analysis.summary.medianMixedConstructionToLandRatio ? (
                          <>
                            <div>
                              {analysis.summary.medianMixedConstructionToLandRatio}
                            </div>
                            <div style={secondaryValue}>
                              Half of mixed listings have a construction area equal to or greater than{' '}
                              {analysis.summary.medianMixedConstructionToLandRatio} of the
                              property area, and half have less.
                            </div>
                          </>
                        ) : (
                          'N/A'
                        )
                      }
                    />

                  <StatCard
                    label="Sample Size"
                    value={`${analysis.sampleSize} listings`}
                  />

                  <StatCard
                    label="Confidence"
                    value={`${analysis.confidence.score}% · ${analysis.confidence.label}`}
                  />
                </div>

                <h2 style={sectionTitle}>
                  Market Breakdown
                </h2>

                <div style={cardGrid}>
                  <StatCard
                    label="Lowest Price ÷ Land Area"
                    value={
                      analysis.breakdown.lowestPricePerLandM2 ? (
                        <>
                          <div>{analysis.breakdown.lowestPricePerLandM2}</div>
                          <div style={secondaryValue}>
                            {analysis.breakdown.lowestPricePerLandFt2}
                          </div>
                        </>
                      ) : (
                        <LimitedData
                          sampleSize={landSample}
                          label="listings with land area only"
                        />
                      )
                    }
                  />

                  <StatCard
                    label="Highest Price ÷ Land Area"
                    value={
                      analysis.breakdown.highestPricePerLandM2 ? (
                        <>
                          <div>{analysis.breakdown.highestPricePerLandM2}</div>
                          <div style={secondaryValue}>
                            {analysis.breakdown.highestPricePerLandFt2}
                          </div>
                        </>
                      ) : (
                        <LimitedData
                          sampleSize={landSample}
                          label="listings with land area only"
                        />
                      )
                    }
                  />

                  <StatCard
                    label="Lowest Price ÷ Construction Area"
                    value={
                      analysis.breakdown.lowestPricePerConstructionM2 ? (
                        <>
                          <div>{analysis.breakdown.lowestPricePerConstructionM2}</div>
                          <div style={secondaryValue}>
                            {analysis.breakdown.lowestPricePerConstructionFt2}
                          </div>
                        </>
                      ) : (
                        <LimitedData
                          sampleSize={constructionSample}
                          label="listings with construction area only"
                        />
                      )
                    }
                  />

                  <StatCard
                    label="Highest Price ÷ Construction Area"
                    value={
                      analysis.breakdown.highestPricePerConstructionM2 ? (
                        <>
                          <div>{analysis.breakdown.highestPricePerConstructionM2}</div>
                          <div style={secondaryValue}>
                            {analysis.breakdown.highestPricePerConstructionFt2}
                          </div>
                        </>
                      ) : (
                        <LimitedData
                          sampleSize={constructionSample}
                          label="listings with construction area only"
                        />
                      )
                    }
                  />

                 <StatCard
                    label="Lowest Mixed Price ÷ Land Area"
                    value={
                      analysis.breakdown.lowestMixedPricePerLandM2 ? (
                        <>
                          <div>{analysis.breakdown.lowestMixedPricePerLandM2}</div>
                          <div style={secondaryValue}>
                            {analysis.breakdown.lowestMixedPricePerLandFt2}
                          </div>
                        </>
                      ) : (
                        <LimitedData
                          sampleSize={mixedSample}
                          label="listings with land and construction area"
                        />
                      )
                    }
                  />

                  <StatCard
                    label="Highest Mixed Price ÷ Land Area"
                    value={
                      analysis.breakdown.highestMixedPricePerLandM2 ? (
                        <>
                          <div>{analysis.breakdown.highestMixedPricePerLandM2}</div>
                          <div style={secondaryValue}>
                            {analysis.breakdown.highestMixedPricePerLandFt2}
                          </div>
                        </>
                      ) : (
                        <LimitedData
                          sampleSize={mixedSample}
                          label="listings with land and construction area"
                        />
                      )
                    }
                  />

                  <StatCard
                    label="Lowest Mixed Price ÷ Construction Area"
                    value={
                      analysis.breakdown.lowestMixedPricePerConstructionM2 ? (
                        <>
                          <div>{analysis.breakdown.lowestMixedPricePerConstructionM2}</div>
                          <div style={secondaryValue}>
                            {analysis.breakdown.lowestMixedPricePerConstructionFt2}
                          </div>
                        </>
                      ) : (
                        <LimitedData
                          sampleSize={mixedSample}
                          label="listings with land and construction area"
                        />
                      )
                    }
                  />

                  <StatCard
                    label="Highest Mixed Price ÷ Construction Area"
                    value={
                      analysis.breakdown.highestMixedPricePerConstructionM2 ? (
                        <>
                          <div>{analysis.breakdown.highestMixedPricePerConstructionM2}</div>
                          <div style={secondaryValue}>
                            {analysis.breakdown.highestMixedPricePerConstructionFt2}
                          </div>
                        </>
                      ) : (
                        <LimitedData
                          sampleSize={mixedSample}
                          label="listings with land and construction area"
                        />
                      )
                    }
                  />

                </div>

            <h2 style={sectionTitle}>
                Matching Listings
            </h2>

            {analysis.listings?.length > 0 ? (
                <div style={listingGrid}>
                {analysis.listings.map((listing: any) => (
                    <div key={listing.id} style={listingCard}>
                    {listing.images?.[0] && (
                        <img
                        src={listing.images[0]}
                        alt={listing.title || 'Listing image'}
                        style={listingImage}
                        />
                    )}

                    <div style={{ padding: '1rem' }}>
                        <h3 style={listingTitle}>
                        {listing.title || 'Untitled Listing'}
                        </h3>

                        <p style={listingMeta}>
                        {listing.province} · {listing.canton}
                        </p>

                        <div style={listingStats}>
                        <p>
                            Price: <strong>{listing.formattedPrice || 'N/A'}</strong>
                        </p>

                        <p>
                            Land Area:{' '}
                            <strong>{listing.property_area || 'N/A'} m²</strong>
                        </p>

                        <p>
                            Construction Area:{' '}
                            <strong>{listing.construction_area || 'N/A'} m²</strong>
                        </p>

                        <p>
                            Price ÷ Land Area:{' '}
                            <strong>{listing.pricePerLandM2 || 'N/A'}</strong>
                        </p>

                        <p>
                            Price ÷ Construction Area:{' '}
                            <strong>{listing.pricePerConstructionM2 || 'N/A'}</strong>
                        </p>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                <div style={emptyCard}>
                No matching listings available yet.
                </div>
            )}
    </section>
  )
}

function StatCard({
  label,
  value
}: {
  label: string
  value: any
}) {
  return (
    <div style={statCard}>
      <p style={cardLabel}>{label}</p>
      <h3 style={cardValue}>{value}</h3>
    </div>
  )
}

const sectionTitle = {
  color: '#ff3B00',
  fontSize: '2rem',
  marginBottom: '1rem'
}

const cardGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
  marginBottom: '2rem'
}

const statCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.25rem'
}

const cardLabel = {
  color: '#888',
  margin: 0,
  fontSize: '.85rem'
}

const cardValue = {
  margin: '.5rem 0 0',
  fontSize: '1.8rem'
}

const secondaryValue = {
  marginTop: '.35rem',
  color: '#888',
  fontSize: '1rem',
  fontWeight: 400
}

const listingGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '2rem',
  marginBottom: '2rem'
}

const listingCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  overflow: 'hidden'
}

const listingImage = {
  width: '100%',
  height: '180px',
  objectFit: 'cover' as const
}

const listingTitle = {
  marginTop: 0,
  marginBottom: '.5rem',
  fontSize: '1.25rem'
}

const listingMeta = {
  color: '#888',
  marginTop: 0
}

const listingStats = {
  color: '#ccc',
  fontSize: '.95rem',
  lineHeight: 1.5
}

const emptyCard = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1.25rem',
  color: '#888',
  marginBottom: '2rem'
}