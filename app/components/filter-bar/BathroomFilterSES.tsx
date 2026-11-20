
'use client'

import { bathroomValueLabel } from '@/lib/bathroom-selection'
import BathroomSelectionControl from '../BathroomSelectionControl'

type Props = {
  selectedBathrooms: string
  setSelectedBathrooms: (value: string) => void
  showBathroomOptions: boolean
  setShowBathroomOptions: (value: boolean) => void
  setShowParkingOptions: (value: boolean) => void
  bathroomOptions: { en: string; es: string }[]
}

export default function BathroomFilterSES({
  selectedBathrooms,
  setSelectedBathrooms,
  showBathroomOptions,
  setShowBathroomOptions,
  setShowParkingOptions
}: Props) {
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h2 style={{
          fontSize: '1rem',
          marginBottom: '1rem',
          color: '#D4AF37'
        }}>
          Baños
        </h2>

        <button
          type="button"
          aria-label="Mostrar u ocultar opciones de baños"
          aria-expanded={showBathroomOptions}
          onClick={() => setShowBathroomOptions(!showBathroomOptions)}
          style={{
            background: 'var(--surface)',
            color: 'var(--foreground)',
            border: '1px solid #D4AF3750',
            borderRadius: '999rem',
            cursor: 'pointer'
          }}
        >
          {showBathroomOptions ? '−' : '+'}
        </button>
      </div>

      {!showBathroomOptions && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: 'var(--surface)',
          border: '1px solid #D4AF3750',
          borderRadius: '1rem',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <span>
            {bathroomValueLabel(selectedBathrooms, 'es') || 'Ninguno seleccionado'}
          </span>

          <button
            type="button"
            aria-label="Borrar baños"
            onClick={() => {
              setSelectedBathrooms('')
              setShowBathroomOptions(true)
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--error-text)',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {showBathroomOptions && (
        <BathroomSelectionControl
          language="es"
          value={selectedBathrooms}
          onChange={(value) => {
            setSelectedBathrooms(value)
            if (value) {
              setShowBathroomOptions(false)
              setShowParkingOptions(true)
            }
          }}
        />
      )}
    </div>
  )
}
