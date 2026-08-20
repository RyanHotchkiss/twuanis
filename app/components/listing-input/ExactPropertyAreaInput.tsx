'use client'

import {
  useEffect,
  useRef,
  useState
} from 'react'

type ExactPropertyAreaInputProps = {
  valueSquareMeters: number | null

  onChange: (
    valueSquareMeters: number | null
  ) => void

  language?: 'en' | 'es'

  initiallyOpen?: boolean
}

type DisplayUnit =
  | 'square_meters'
  | 'hectares'

const MINIMUM_AREA = 0
const MAXIMUM_AREA = 99_999_999

const HOLD_DELAY = 350
const REPEAT_INTERVAL = 75

const INCREMENTS = [
  1,
  10,
  100,
  1_000,
  10_000
]

export default function ExactPropertyAreaInput({
  valueSquareMeters,
  onChange,
  language = 'en',
  initiallyOpen = true
}: ExactPropertyAreaInputProps) {
  const [isOpen, setIsOpen] =
    useState(initiallyOpen)

  const [displayUnit, setDisplayUnit] =
    useState<DisplayUnit>(
      'square_meters'
    )

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
          heading: 'Área de Terreno',
          none: 'Ninguna Seleccionada',
          exact:
            'Ingrese el área exacta del terreno o parcela',
          squareMeters: 'm²',
          hectares: 'Hectáreas',
          clear: 'Borrar',
          collapse:
            'Contraer área de terreno',
          expand:
            'Expandir área de terreno'
        }
      : {
          heading: 'Land Area',
          none: 'None Selected',
          exact:
            'Enter the exact land or parcel area',
          squareMeters: 'm²',
          hectares: 'Hectares',
          clear: 'Clear',
          collapse:
            'Collapse land area',
          expand:
            'Expand land area'
        }

  const currentSquareMeters =
    valueSquareMeters ?? 0

  const displayedSummary =
    valueSquareMeters !== null &&
    valueSquareMeters > 0
      ? displayUnit === 'square_meters'
        ? `${formatSquareMeters(
            valueSquareMeters
          )} m²`
        : `${formatHectares(
            valueSquareMeters
          )} ha`
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

  function getIncrementLabel(
    squareMeters: number
  ): string {
    if (
      displayUnit ===
      'square_meters'
    ) {
      return formatSquareMeters(
        squareMeters
      )
    }

    return formatHectareIncrement(
      squareMeters
    )
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

      {isOpen && (
        <div style={unitToggle}>
          <button
            type="button"
            onClick={() =>
              setDisplayUnit(
                'square_meters'
              )
            }
            style={
              displayUnit ===
              'square_meters'
                ? activeUnitButton
                : unitButton
            }
          >
            {labels.squareMeters}
          </button>

          <button
            type="button"
            onClick={() =>
              setDisplayUnit(
                'hectares'
              )
            }
            style={
              displayUnit ===
              'hectares'
                ? activeUnitButton
                : unitButton
            }
          >
            {labels.hectares}
          </button>
        </div>
      )}

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
            {displayUnit ===
            'square_meters'
              ? formatSquareMeters(
                  currentSquareMeters
                )
              : formatHectares(
                  currentSquareMeters
                )}

            {' '}

            <span style={displayUnitStyle}>
              {displayUnit ===
              'square_meters'
                ? 'm²'
                : 'ha'}
            </span>
          </div>

          <div style={controls}>
            {INCREMENTS.map(
              increment => (
                <IncrementControl
                  key={increment}
                  amount={increment}
                  label={getIncrementLabel(
                    increment
                  )}
                  unit={
                    displayUnit ===
                    'square_meters'
                      ? 'm²'
                      : 'ha'
                  }
                  onStart={
                    startChanging
                  }
                  onStop={
                    stopChanging
                  }
                  onClick={
                    handleClick
                  }
                />
              )
            )}
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

  label: string

  unit: string

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
  label,
  unit,
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
        aria-label={
          `Increase by ${label} ${unit}`
        }
      >
        ▲
      </button>

      <div style={incrementLabel}>
        +{label}
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
        aria-label={
          `Decrease by ${label} ${unit}`
        }
      >
        ▼
      </button>

      <div style={incrementLabel}>
        −{label}
      </div>
    </div>
  )
}

function formatSquareMeters(
  value: number
): string {
  return new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits: 0
    }
  ).format(value)
}

function formatHectares(
  squareMeters: number
): string {
  return (
    squareMeters / 10_000
  ).toLocaleString(
    'en-US',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    }
  )
}

function formatHectareIncrement(
  squareMeters: number
): string {
  const hectares =
    squareMeters / 10_000

  return hectares.toLocaleString(
    'en-US',
    {
      minimumFractionDigits:
        hectares < 1
          ? 4
          : 0,

      maximumFractionDigits: 4
    }
  )
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

const unitToggle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '.5rem',
  marginBottom: '1rem'
}

const unitButton = {
  background: '#181818',
  border: '1px solid #333',
  color: '#888',
  padding: '.55rem 1rem',
  borderRadius: '999rem',
  cursor: 'pointer'
}

const activeUnitButton = {
  ...unitButton,
  color: '#D4AF37',
  border: '1px solid #D4AF37'
}

const areaDisplay = {
  fontSize: 'clamp(1.75rem, 6vw, 3rem)',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  color: '#FFFFFF',
  margin: '1rem 0 1.25rem'
}

const displayUnitStyle = {
  fontSize: '.5em',
  color: '#D4AF37',
  fontWeight: 600
}

const controls = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  gap: 'clamp(.35rem, 2vw, 1rem)',
  width: '100%',
  overflowX: 'auto' as const,
  paddingBottom: '.5rem'
}

const incrementColumn = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: '.35rem',
  flexShrink: 0
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