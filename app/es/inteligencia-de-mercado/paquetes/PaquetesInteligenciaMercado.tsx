'use client'

import {
  useState
} from 'react'

import PackageCard from '@/app/components/PackageCard'
import PackageModal from '@/app/components/PackageModal'
import EngineComparisonTable from '@/app/components/EngineComparisonTable'

import {
  marketIntelligencePackages,
  type MarketIntelligencePackage
} from '@/lib/marketIntelligencePackages'

export default function PaquetesInteligenciaMercado() {
  const [
    selectedPackage,
    setSelectedPackage
  ] =
    useState<MarketIntelligencePackage | null>(
      null
    )

  function handleLearnMore(
    pkg: MarketIntelligencePackage
  ) {
    setSelectedPackage(pkg)
  }

  function handleCloseModal() {
    setSelectedPackage(null)
  }

  function handleChoosePackage(
    pkg: MarketIntelligencePackage
  ) {
    /*
     * Reemplazaremos esto cuando existan
     * el sistema de cuentas y el flujo de pago.
     */
    console.log(
      'PAQUETE SELECCIONADO:',
      pkg.id
    )
  }

  return (
    <>
      <section style={hero}>
        
        <h1 style={heading}>
          Paquetes de Inteligencia de Mercado
        </h1>

        <p style={intro}>
          Elija la colección de motores de
          inteligencia inmobiliaria que reduzca
          la incertidumbre del mercado que afecta
          sus decisiones.
        </p>
      </section>

      <section
        style={packageSection}
        aria-label="Paquetes de inteligencia de mercado"
      >
        <div style={packageGrid}>
          {marketIntelligencePackages.map(
            pkg => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                language="es"
                onLearnMore={
                  handleLearnMore
                }
                onChoosePackage={
                  handleChoosePackage
                }
              />
            )
          )}
        </div>
      </section>

      <EngineComparisonTable
        packages={
          marketIntelligencePackages
        }
        language="es"
      />

      <PackageModal
        pkg={selectedPackage}
        language="es"
        open={
          selectedPackage !== null
        }
        onClose={handleCloseModal}
        onChoosePackage={
          handleChoosePackage
        }
      />
    </>
  )
}

const hero = {
  maxWidth: '920px',
  margin: '0 auto 3rem',
  textAlign: 'center' as const
}

const eyebrow = {
  margin: '0 0 .65rem',
  color: '#C7A44B',
  fontSize: '.8rem',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '.12em'
}

const heading = {
  margin: 0,
  color: '#fff',
  fontSize:
    'clamp(2.25rem, 7vw, 4.5rem)',
  lineHeight: 1.05
}

const intro = {
  maxWidth: '780px',
  margin: '1.25rem auto 0',
  color: '#aaa',
  fontSize:
    'clamp(1rem, 2.5vw, 1.2rem)',
  lineHeight: 1.65
}

const packageSection = {
  width: '100%'
}

const packageGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(280px, 1fr))',
  alignItems: 'stretch',
  gap: '1.25rem'
}