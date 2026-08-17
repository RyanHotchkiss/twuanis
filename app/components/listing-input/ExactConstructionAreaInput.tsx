'use client'

import {
  useEffect,
  useRef,
  useState
} from 'react'

type ExactConstructionAreaInputProps = {
  valueSquareMeters: number | null

  onChange: (
    valueSquareMeters: number | null
  ) => void

  language?: 'en' | 'es'

  initiallyOpen?: boolean
}

const MINIMUM_AREA = 0
const MAXIMUM_AREA = 9_999_999

const HOLD_DELAY = 350
const REPEAT_INTERVAL = 75

export default function ExactConstructionAreaInput({
  valueSquareMeters,
  onChange,
  language = 'en',
  initiallyOpen = true
}: ExactConstructionAreaInputProps) {
  const [isOpen, setIsOpen] =
    useState(initiallyOpen)

  const valueRef =
    useRef(valueSquareMeters ?? 0)

  const holdTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    )

  const repeatIntervalRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    )

  const holdActivatedRef =
    useRef(false)

  useEffect(() => {
    valueRef.current =
      valueSquareMeters ?? 0
  }, [valueSquareMeters])

  useEffect(() => {
    return () => {
      stopChanging()
    }
  }, [])

  const labels =
    language === 'es'
      ? {
          heading: 'Área de Construcción',
          none: 'Ninguna Seleccionada',
          exact: 'Ingrese el área exacta',
          clear: 'Borrar',
          collapse:
            'Contraer área de construcción',
          expand:
            'Expandir área de construcción'
        }
      : {
          heading: 'Construction Area',
          none: 'None Selected',
          exact: 'Enter the exact area',
          clear: 'Clear',
          collapse:
            'Collapse construction area',
          expand:
            'Expand construction area'
        }

  const currentValue =
    valueSquareMeters ?? 0

  const displayedSummary =
    valueSquareMeters !== null &&
    valueSquareMeters > 0
      ? `${formatNumber(
          valueSquareMeters
        )} m²`
      : labels.none

  function commitValue(
    nextValue: number
  ) {
    const boundedValue =
      Math.min(
        MAXIMUM_AREA,
        Math.max(
          MINIMUM_AREA,
          Math.round(nextValue)
        )
      )

    valueRef.current =
      boundedValue

    if (boundedValue === 0) {
      onChange(null)
      return
    }

    onChange(boundedValue)
  }

  function changeBy(
    amount: number
  ) {
    commitValue(
      valueRef.current + amount
    )
  }

  function startChanging(
    amount: number
  ) {
    stopChanging()

    holdActivatedRef.current = false

    holdTimeoutRef.current =
      setTimeout(() => {
        holdActivatedRef.current = true

        changeBy(amount)

        repeatIntervalRef.current =
          setInterval(() => {
            changeBy(amount)
          }, REPEAT_INTERVAL)
      }, HOLD_DELAY)
  }

  function stopChanging() {
    if (holdTimeoutRef.current) {
      clearTimeout(
        holdTimeoutRef.current
      )

      holdTimeoutRef.current = null
    }

    if (repeatIntervalRef.current) {
      clearInterval(
        repeatIntervalRef.current
      )

      repeatIntervalRef.current = null
    }
  }

  function handleClick(
    amount: number
  ) {
    if (holdActivatedRef.current) {
      holdActivatedRef.current = false
      return
    }

    changeBy(amount)
  }

  function clearValue() {
    stopChanging()

    valueRef.current = 0

    onChange(null)

    setIsOpen(true)
  }

  return (
    <div>
      <div style={header}>
        <div>
          <h2 style={sectionHeading}>
            {labels.heading}
          </h2>

          {isOpen && (
            <div style={instruction}>
              {labels.exact}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            setIsOpen(
              current => !current
            )
          }
          style={collapseButton}
          aria-label={
            isOpen
              ? labels.collapse
              : labels.expand
          }
        >
          {isOpen ? '−' : '+'}
        </button>
      </div>

      {!isOpen && (
        <div style={summaryCard}>
          <span>
            {displayedSummary}
          </span>

          {valueSquareMeters !== null && (
            <button
              type="button"
              onClick={clearValue}
              style={resetButton}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {isOpen && (
        <>
          <div style={areaDisplay}>
            {formatNumber(
              currentValue
            )}{' '}
            <span style={displayUnit}>
              m²
            </span>
          </div>

          <div style={controls}>
            <IncrementControl
              amount={1}
              onStart={startChanging}
              onStop={stopChanging}
              onClick={handleClick}
            />

            <IncrementControl
              amount={10}
              onStart={startChanging}
              onStop={stopChanging}
              onClick={handleClick}
            />

            <IncrementControl
              amount={100}
              onStart={startChanging}
              onStop={stopChanging}
              onClick={handleClick}
            />
          </div>

          {valueSquareMeters !== null && (
            <div style={clearContainer}>
              <button
                type="button"
                onClick={clearValue}
                style={clearButton}
              >
                {labels.clear}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

type IncrementControlProps = {
  amount: number

  onStart: (
    amount: number
  ) => void

  onStop: () => void

  onClick: (
    amount: number
  ) => void
}

function IncrementControl({
  amount,
  onStart,
  onStop,
  onClick
}: IncrementControlProps) {
  return (
    <div style={incrementColumn}>
      <button
        type="button"
        onPointerDown={() =>
          onStart(amount)
        }
        onPointerUp={onStop}
        onPointerCancel={onStop}
        onPointerLeave={onStop}
        onClick={() =>
          onClick(amount)
        }
        style={areaArrow}
        aria-label={`Increase by ${amount} square meters`}
      >
        ▲
      </button>

      <div style={incrementLabel}>
        +{formatNumber(amount)}
      </div>

      <button
        type="button"
        onPointerDown={() =>
          onStart(-amount)
        }
        onPointerUp={onStop}
        onPointerCancel={onStop}
        onPointerLeave={onStop}
        onClick={() =>
          onClick(-amount)
        }
        style={areaArrow}
        aria-label={`Decrease by ${amount} square meters`}
      >
        ▼
      </button>

      <div style={incrementLabel}>
        −{formatNumber(amount)}
      </div>
    </div>
  )
}

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits: 0
    }
  ).format(value)
}

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1rem'
}

const sectionHeading = {
  fontSize: '1rem',
  marginBottom: '.25rem',
  color: '#D4AF37'
}

const instruction = {
  color: '#888',
  fontSize: '.8rem'
}

const collapseButton = {
  background: '#181818',
  border: '1px solid #333',
  color: '#FFFFFF',
  width: '2rem',
  height: '2rem',
  borderRadius: '999rem',
  cursor: 'pointer'
}

const areaDisplay = {
  fontSize: 'clamp(1.75rem, 6vw, 3rem)',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  color: '#FFFFFF',
  margin: '1rem 0 1.25rem'
}

const displayUnit = {
  fontSize: '.5em',
  color: '#D4AF37',
  fontWeight: 600
}

const controls = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  gap: 'clamp(.75rem, 4vw, 2rem)',
  width: '100%'
}

const incrementColumn = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: '.35rem'
}

const areaArrow = {
  background: '#181818',
  border: '1px solid #333',
  color: '#FFFFFF',
  width: '3rem',
  height: '3rem',
  borderRadius: '.75rem',
  cursor: 'pointer',
  fontSize: '1.15rem',
  flexShrink: 0,
  touchAction: 'none'
}

const incrementLabel = {
  color: '#D4AF37',
  fontSize: '.75rem',
  fontVariantNumeric: 'tabular-nums'
}

const clearContainer = {
  display: 'flex',
  justifyContent: 'center',
  marginTop: '1.25rem'
}

const clearButton = {
  background: 'transparent',
  border: '1px solid #333',
  color: '#ff6666',
  padding: '.55rem .85rem',
  borderRadius: '999rem',
  cursor: 'pointer'
}

const summaryCard = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: '#181818',
  border: '1px solid #D4AF3750',
  borderRadius: '1rem',
  padding: '1rem',
  marginTop: '1rem',
  color: '#FFFFFF'
}

const resetButton = {
  background: 'transparent',
  border: 'none',
  color: '#ff6666',
  cursor: 'pointer',
  fontSize: '1rem'
}