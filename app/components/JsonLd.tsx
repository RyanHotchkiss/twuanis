export default function JsonLd({ data }: { data: unknown }) {
  console.log(
  'JsonLd received:',
  Array.isArray(data)
    ? data.length
    : 'not array'
)
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c')
      }}
    />
  )
}