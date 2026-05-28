'use client'

import HomeButton from '@/app/components/HomeButton'
import SearchButton from '@/app/components/SearchButton'
import CreateListingButtonS from '@/app/components/CreateListingButtonS'
import FilterButton from '@/app/components/FilterButton'
import SwipeCard from '@/app/components/SwipeCard'
import Favorites from '@/app/components/Favorites'
import HelpButton from '@/app/components/HelpButton'
import LanguageButtonES from '@/app/components/LanguageButtonES'
import Link from 'next/link'

type TopBarProps = {
  onFilterClick: () => void
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

      <HomeButton
        href="/es"
      />

      <SearchButton
        onClick={() => {
          window.location.href =
            '/es?overlay=looking'
        }}
      />

      <FilterButton
        onClick={onFilterClick}
      />

      <div style={{ marginRight: '.5rem' }}>
        <CreateListingButtonS
            onCreateListing={() => {
            window.location.href =
                '/es?overlay=posting'
            }}
        />
        </div>
      <SwipeCard

        href="/es/deslizar/comprar"

        label=""

      />

      <Favorites
        href="/es/favoritos"
        label="Favorite Properties"
        icon="♥"
      />

     <Link
          href="/es/soporte/ayuda"
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

      <LanguageButtonES />

    </div>

  )

}