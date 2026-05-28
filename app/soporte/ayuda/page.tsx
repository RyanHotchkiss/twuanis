'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import TopBarES from '@/app/components/TopBarES'
import HomeButton from '@/app/components/HomeButton'
import SearchButton from '@/app/components/SearchButton'
import FilterButton from '@/app/components/FilterButton'
import CreateListingButtonS from '@/app/components/CreateListingButtonS'
import SwipeCard from '@/app/components/SwipeCard'
import Favorites from '@/app/components/Favorites'
import HelpButton from '@/app/components/HelpButton'
import LanguageButtonES from '@/app/components/LanguageButtonES'
export default function HelpPage() {

  const [isMobile, setIsMobile] =
    useState(false)

  useEffect(() => {

    function handleResize() {

      setIsMobile(
        window.innerWidth <= 768
      )

    }

    handleResize()

    window.addEventListener(
      'resize',
      handleResize
    )

    return () => {

      window.removeEventListener(
        'resize',
        handleResize
      )

    }

  }, [])

  return (

    <main style={{
      background:'#000',
      minHeight:'100vh',
      color:'#fff',
      padding:'20px',
      overflow:'hidden'
    }}>

      {/* TOP NAV */}
      <div style={{
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        padding:'.5rem 0',
        marginBottom:'40px',
        borderBottom:'1px solid #151515'
      }}>

        <TopBarES />

      </div>

      {/* HEADER */}
      <div style={{
        textAlign:'center',
        marginBottom:'50px'
      }}>

        <h1 style={{
          fontSize:isMobile
            ? '48px'
            : '72px',

          marginBottom:'10px',
          color:'#ff3b00'
        }}>
          Centro de Ayuda
        </h1>

        <p style={{
          color:'#999',
          fontSize:isMobile
            ? '18px'
            : '22px',

          maxWidth:'50rem',
          margin:'0 auto',
          lineHeight:'1.7'
        }}>
          Aprende qué significan los íconos del marketplace,
            cómo funcionan las mejoras de visibilidad
            y cómo contactar soporte.
        </p>

      </div>

        {/* TopBarES ICONS */}
          <div style={{
            padding:isMobile
              ? '24px'
              : '40px',

            borderBottom:'1px solid #1d1d1d'
          }}>

            <h2 style={sectionHeading}>
              Íconos de Navegación
            </h2>

            <div style={iconGrid}>

              <div style={iconCard}>
                <div style={icon}>

                  <HomeButton />

                </div>

                <div>
                  <h3 style={iconTitle}>
                    Inicio
                  </h3>

                  <p style={iconDescription}>
                    Regresa a la página principal del marketplace.
                  </p>
                </div>
              </div>

              <div style={iconCard}>
                <div style={icon}>

                <SearchButton />

              </div>

                <div>
                  <h3 style={iconTitle}>
                    Buscar
                  </h3>

                  <p style={iconDescription}>
                    Busca propiedades dentro del marketplace.
                  </p>
                </div>
              </div>

              <div style={iconCard}>
                <div style={icon}>

                  <FilterButton />

                </div>

                <div>
                  <h3 style={iconTitle}>
                    Filtros
                  </h3>

                  <p style={iconDescription}>
                    Abre herramientas avanzadas de filtrado de propiedades.
                  </p>
                </div>
              </div>

              <div style={iconCard}>
                <div style={icon}>

                  <CreateListingButtonS />

                </div>

                <div>
                  <h3 style={iconTitle}>
                    Crear Publicación
                  </h3>

                  <p style={iconDescription}>
                    Publica una propiedad dentro del marketplace.
                  </p>
                </div>
              </div>

              <div style={iconCard}>
                <div style={icon}>

                <SwipeCard />

              </div>

                <div>
                  <h3 style={iconTitle}>
                    Modo Deslizar
                  </h3>

                  <p style={iconDescription}>
                    Explora propiedades usando navegación por deslizamiento.
                  </p>
                </div>
              </div>

              <div style={iconCard}>
                <div style={icon}>

                  <Favorites />

                </div>

                <div>
                  <h3 style={iconTitle}>
                    Favoritos
                  </h3>

                  <p style={iconDescription}>
                    Visualiza tus propiedades guardadas y favoritas.
                  </p>
                </div>
              </div>

              <div style={iconCard}>
                <div style={icon}>

                  <HelpButton />

                </div>

                <div>
                  <h3 style={iconTitle}>
                    Ayuda
                  </h3>

                  <p style={iconDescription}>
                    Aprende cómo funciona el marketplace y contacta soporte.
                  </p>
                </div>
              </div>

              <div style={iconCard}>
                <div style={icon}>

                  <LanguageButtonES />

                </div>

                <div>
                  <h3 style={iconTitle}>
                    Cambiar Idioma
                  </h3>

                  <p style={iconDescription}>
                    Cambia entre inglés y español.
                  </p>
                </div>
              </div>

            </div>

          </div>

      {/* MAIN PANEL */}
      <div style={{
        background:'#111',
        border:'1px solid #222',
        borderRadius:'28px',
        overflow:'hidden',
        width:'100%'
      }}>

        {/* SECTION */}
        <div style={{
          padding:isMobile
            ? '24px'
            : '40px',

          borderBottom:'1px solid #1d1d1d'
        }}>

          <h2 style={sectionHeading}>
            Íconos del Marketplace
          </h2>

          <div style={iconGrid}>

            <div style={iconCard}>
              <div style={icon}>⭐</div>
              <div>
                <h3 style={iconTitle}>
                  Propiedad Destacada
                </h3>

                <p style={iconDescription}>
                  Mayor visibilidad dentro del marketplace.
                </p>
              </div>
            </div>

            <div style={iconCard}>
              <div style={icon}>🔥</div>
              <div>
                <h3 style={iconTitle}>
                  Vendedor Motivado
                </h3>

                <p style={iconDescription}>
                  El vendedor busca cerrar la venta rápidamente.
                </p>
              </div>
            </div>

            <div style={iconCard}>
              <div style={icon}>⚡</div>
              <div>
                <h3 style={iconTitle}>
                  Alta Demanda
                </h3>

                <p style={iconDescription}>
                  La propiedad actualmente recibe mucho interés.
                </p>
              </div>
            </div>

            <div style={iconCard}>
              <div style={icon}>✔</div>
              <div>
                <h3 style={iconTitle}>
                  Vendedor Verificado
                </h3>

                <p style={iconDescription}>
                 La identidad o información de contacto del vendedor ha sido verificada.
                </p>
              </div>
            </div>

            <div style={iconCard}>
              <div style={icon}>🏠</div>
              <div>
                <h3 style={iconTitle}>
                  Casa Abierta
                </h3>

                <p style={iconDescription}>
                  La propiedad actualmente ofrece visitas programadas.
                </p>
              </div>
            </div>

            <div style={iconCard}>
              <div style={icon}>🌊</div>
              <div>
                <h3 style={iconTitle}>
                  Vista al Mar
                </h3>

                <p style={iconDescription}>
                  La propiedad incluye vistas al océano.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* VISIBILITY */}
        <div style={{
          padding:isMobile
            ? '24px'
            : '40px',

          borderBottom:'1px solid #1d1d1d'
        }}>

          <h2 style={sectionHeading}>
            Mejoras de Visibilidad
          </h2>

          <div style={stackWrap}>

            <div style={infoCard}>
              <h3 style={infoHeading}>
                Posición Destacada
              </h3>

              <p style={infoText}>
                Incrementa la visibilidad de la propiedad
                dentro de los resultados de búsqueda.
              </p>
            </div>

            <div style={infoCard}>
              <h3 style={infoHeading}>
                Ubicación Prioritaria
              </h3>

              <p style={infoText}>
                Aparece más arriba dentro de categorías
                o ubicaciones seleccionadas.
              </p>
            </div>

            <div style={infoCard}>
              <h3 style={infoHeading}>
                Impulsos de Visibilidad
              </h3>

              <p style={infoText}>
                Mejoras temporales de visibilidad para
                casas abiertas, precios reducidos
                o campañas activas.
              </p>
            </div>

          </div>

        </div>

        {/* LISTING RULES */}
        <div style={{
          padding:isMobile
            ? '24px'
            : '40px',

          borderBottom:'1px solid #1d1d1d'
        }}>

          <h2 style={sectionHeading}>
            Reglas de Publicación
          </h2>

          <div style={stackWrap}>

            <div style={ruleCard}>
              Solo se pueden publicar propiedades reales.
            </div>

            <div style={ruleCard}>
              Las publicaciones duplicadas o spam pueden ser eliminadas.
            </div>

            <div style={ruleCard}>
              Información engañosa puede resultar en restricciones de cuenta.
            </div>

            <div style={ruleCard}>
              Las publicaciones deben incluir información de contacto válida.
            </div>

          </div>

        </div>

        {/* CONTACT */}
        <div style={{
          padding:isMobile
            ? '24px'
            : '40px'
        }}>

          <h2 style={sectionHeading}>
            Contactar Soporte
          </h2>

          <p style={{
            color:'#999',
            lineHeight:'1.8',
            marginBottom:'24px',
            maxWidth:'42rem'
          }}>
            ¿Necesitas ayuda publicando una propiedad?
            ¿Preguntas sobre mejoras de visibilidad?
            Contáctanos directamente por WhatsApp.
          </p>

          <a
            href="https://wa.me/50688074137"
            target="_blank"
            rel="noopener noreferrer"
            style={whatsappButton}
          >

            <span style={{
              fontSize:'1.5rem'
            }}>
              💬
            </span>

            Contactar Soporte por WhatsApp

          </a>

        </div>

      </div>

    </main>

  )

}

const sectionHeading = {
  fontSize:'1.5rem',
  marginBottom:'1.5rem',
  color:'#ff3b00'
}

const iconGrid = {
  display:'grid',
  gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',
  gap:'1rem'
}

const iconCard = {
  background:'#181818',
  border:'1px solid #222',
  borderRadius:'20px',
  padding:'1.25rem',
  display:'flex',
  alignItems:'flex-start',
  gap:'1rem'
}

const icon = {
  fontSize:'2rem',
  lineHeight:1
}

const iconTitle = {
  fontSize:'1rem',
  marginBottom:'.5rem'
}

const iconDescription = {
  color:'#888',
  lineHeight:'1.6',
  fontSize:'.95rem'
}

const stackWrap = {
  display:'flex',
  flexDirection:'column' as const,
  gap:'1rem'
}

const infoCard = {
  background:'#181818',
  border:'1px solid #222',
  borderRadius:'18px',
  padding:'1.25rem'
}

const infoHeading = {
  marginBottom:'.5rem',
  fontSize:'1rem'
}

const infoText = {
  color:'#888',
  lineHeight:'1.7'
}

const ruleCard = {
  background:'#181818',
  border:'1px solid #222',
  borderRadius:'18px',
  padding:'1rem 1.25rem',
  color:'#bbb'
}

const whatsappButton = {
  display:'inline-flex',
  alignItems:'center',
  gap:'.75rem',

  background:'#00ff9950',
  border:'1px solid #ffffff50',

  color:'#fff',
  textDecoration:'none',

  padding:'1rem 1.5rem',
  borderRadius:'999rem',

  fontWeight:'bold',

  cursor:'pointer',

  transition:'all .2s ease'
}