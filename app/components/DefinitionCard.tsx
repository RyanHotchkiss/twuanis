import {
  definitionCard,
  definitionLabel,
  definitionValue
} from '@/app/styles/sell-styles'

export default function DefinitionCard({
  label,
  value
}: {
  label: string
  value: React.ReactNode
}) {

  return (

    <div style={definitionCard}>

      <p style={definitionLabel}>
        {label}
      </p>

      <h3 style={definitionValue}>
        {value}
      </h3>

    </div>

  )

}