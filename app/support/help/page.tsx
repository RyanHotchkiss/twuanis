'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import TopBar from '@/app/components/TopBar'
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

        <TopBar />

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
          Help Center
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
          Learn what marketplace icons mean,
          how visibility upgrades work,
          and how to contact support.
        </p>

      </div>

        {/* TOPBAR ICONS */}
          <div style={{
            padding:isMobile
              ? '24px'
              : '40px',

            borderBottom:'1px solid #1d1d1d'
          }}>

            <h2 style={sectionHeading}>
              Navigation Icons
            </h2>

            <div style={iconGrid}>

              <div style={iconCard}>
                <div style={icon}>

                  <HomeButton />

                </div>

                <div>
                  <h3 style={iconTitle}>
                    Home
                  </h3>

                  <p style={iconDescription}>
                    Return to the main marketplace homepage.
                  </p>
                </div>
              </div>

              <div style={iconCard}>
                <div style={icon}>

                <SearchButton />

              </div>

                <div>
                  <h3 style={iconTitle}>
                    Search
                  </h3>

                  <p style={iconDescription}>
                    Search listings across the marketplace.
                  </p>
                </div>
              </div>

              <div style={iconCard}>
                <div style={icon}>

                  <FilterButton />

                </div>

                <div>
                  <h3 style={iconTitle}>
                    Filters
                  </h3>

                  <p style={iconDescription}>
                    Open advanced property filtering tools.
                  </p>
                </div>
              </div>

              <div style={iconCard}>
                <div style={icon}>

                  <CreateListingButtonS />

                </div>

                <div>
                  <h3 style={iconTitle}>
                    Create Listing
                  </h3>

                  <p style={iconDescription}>
                    Publish a property listing to the marketplace.
                  </p>
                </div>
              </div>

              <div style={iconCard}>
                <div style={icon}>

                <SwipeCard />

              </div>

                <div>
                  <h3 style={iconTitle}>
                    Swipe Mode
                  </h3>

                  <p style={iconDescription}>
                    Browse listings using swipe-based navigation.
                  </p>
                </div>
              </div>

              <div style={iconCard}>
                <div style={icon}>

                  <Favorites />

                </div>

                <div>
                  <h3 style={iconTitle}>
                    Favorites
                  </h3>

                  <p style={iconDescription}>
                    View your saved and favorited properties.
                  </p>
                </div>
              </div>

              <div style={iconCard}>
                <div style={icon}>

                  <HelpButton />

                </div>

                <div>
                  <h3 style={iconTitle}>
                    Help
                  </h3>

                  <p style={iconDescription}>
                    Learn how the marketplace works and contact support.
                  </p>
                </div>
              </div>

              <div style={iconCard}>
                <div style={icon}>

                  <LanguageButtonES />

                </div>

                <div>
                  <h3 style={iconTitle}>
                    Language Toggle
                  </h3>

                  <p style={iconDescription}>
                    Switch between English and Spanish.
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
            Marketplace Icons
          </h2>

          <div style={iconGrid}>

            <div style={iconCard}>
              <div style={icon}>⭐</div>
              <div>
                <h3 style={iconTitle}>
                  Featured Listing
                </h3>

                <p style={iconDescription}>
                  Increased marketplace visibility.
                </p>
              </div>
            </div>

            <div style={iconCard}>
              <div style={icon}>🔥</div>
              <div>
                <h3 style={iconTitle}>
                  Motivated Seller
                </h3>

                <p style={iconDescription}>
                  Seller is actively looking to close quickly.
                </p>
              </div>
            </div>

            <div style={iconCard}>
              <div style={icon}>⚡</div>
              <div>
                <h3 style={iconTitle}>
                  High Interest
                </h3>

                <p style={iconDescription}>
                  Listing currently receiving strong engagement.
                </p>
              </div>
            </div>

            <div style={iconCard}>
              <div style={icon}>✔</div>
              <div>
                <h3 style={iconTitle}>
                  Verified Seller
                </h3>

                <p style={iconDescription}>
                  Seller identity or contact information verified.
                </p>
              </div>
            </div>

            <div style={iconCard}>
              <div style={icon}>🏠</div>
              <div>
                <h3 style={iconTitle}>
                  Open House
                </h3>

                <p style={iconDescription}>
                  Property currently offering scheduled visits.
                </p>
              </div>
            </div>

            <div style={iconCard}>
              <div style={icon}>🌊</div>
              <div>
                <h3 style={iconTitle}>
                  Ocean View
                </h3>

                <p style={iconDescription}>
                  Property includes ocean-facing views.
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
            Visibility Upgrades
          </h2>

          <div style={stackWrap}>

            <div style={infoCard}>
              <h3 style={infoHeading}>
                Featured Position
              </h3>

              <p style={infoText}>
                Increase listing visibility within
                marketplace search results.
              </p>
            </div>

            <div style={infoCard}>
              <h3 style={infoHeading}>
                Priority Placement
              </h3>

              <p style={infoText}>
                Appear higher within selected
                property categories or locations.
              </p>
            </div>

            <div style={infoCard}>
              <h3 style={infoHeading}>
                Visibility Boosts
              </h3>

              <p style={infoText}>
                Short-term visibility upgrades for
                open houses, reduced prices,
                or active campaigns.
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
            Listing Rules
          </h2>

          <div style={stackWrap}>

            <div style={ruleCard}>
              Only real properties may be listed.
            </div>

            <div style={ruleCard}>
              Duplicate spam listings may be removed.
            </div>

            <div style={ruleCard}>
              Misleading property information may result in account restrictions.
            </div>

            <div style={ruleCard}>
              Listings must include valid contact information.
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
            Contact Support
          </h2>

          <p style={{
            color:'#999',
            lineHeight:'1.8',
            marginBottom:'24px',
            maxWidth:'42rem'
          }}>
            Need help posting a property?
            Questions about visibility upgrades?
            Contact us directly on WhatsApp.
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

            Contact Support on WhatsApp

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