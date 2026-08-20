import {
  getPriceMeterAnalysis
} from '@/lib/price-meter-engine'


export default async function Page() {

  const analysis =
    await getPriceMeterAnalysis(
      {
        transaction_type:
          'sale'
      },
      'en'
    )


  return (
    <pre
      style={{
        whiteSpace:
          'pre-wrap',

        padding:
          '24px',

        fontSize:
          '12px'
      }}
    >
      {JSON.stringify(
        analysis
          .saleIntelligence
          .geography,
        null,
        2
      )}
    </pre>
  )
}