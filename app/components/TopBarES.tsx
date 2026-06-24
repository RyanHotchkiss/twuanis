'use client'

import HomeButton from '@/app/components/HomeButton'
import SearchButton from '@/app/components/SearchButton'
import CreateListingButtonS from '@/app/components/CreateListingButtonS'
import Explore from '@/app/components/Explore'
import SwipeCard from '@/app/components/SwipeCard'
import Favorites from '@/app/components/Favorites'
import HelpButton from '@/app/components/HelpButton'
import LanguageButtonEN from '@/app/components/LanguageButtonEN'
import Link from 'next/link'

type TopBarProps = {
  onFilterClick?: () => void
}

export default function TopBar({
  onFilterClick
}: TopBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '.5rem',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        width: '100%',
        maxWidth: '52rem',
        margin: '0 auto',
        paddingBottom: '.5rem',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <HomeButton href="/es?skipintro=true" />

      <SearchButton
        onClick={() => {
          window.location.href = '/es?overlay=looking'
        }}
      />

      <CreateListingButtonS
        onCreateListing={() => {
          window.location.href = '/es?overlay=posting'
        }}
      />

      <Explore
        href="/es/explora"
        label=""
      />

      <SwipeCard
        href="/es/deslizar/comprar"
        label=""
      />

      <Favorites
        href="/es/favoritos"
        label="Propiedades Favoritas"
        icon="♥"
      />

      <Link
        href="/soporte/ayuda"
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          background: 'transparent',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <HelpButton />
      </Link>

      <LanguageButtonEN />
    </div>
  )
}