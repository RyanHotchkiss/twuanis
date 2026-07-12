'use client'

import Link from 'next/link'

import {
  House,
  Search,
  Megaphone,
  Compass,
  ArrowLeftRight,
  Heart,
  CircleHelp
} from 'lucide-react'

type TopBarProps = {
  onFilterClick?: () => void
}

const navIcon = {
  size: 34,
  strokeWidth: 0.5,
  color: '#C7A44B'
}

const linkStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
  background: 'transparent',
  WebkitTapHighlightColor: 'transparent',
  transition: 'opacity .2s ease'
} as const

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

      <Link
        href="/es?skipintro=true"
        style={linkStyle}
        onMouseEnter={e => (e.currentTarget.style.opacity = '.7')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <House {...navIcon} />
      </Link>

      <Link
        href="/es?overlay=looking"
        style={linkStyle}
        onMouseEnter={e => (e.currentTarget.style.opacity = '.7')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <Search {...navIcon} />
      </Link>

      <Link
        href="/es?overlay=posting"
        style={linkStyle}
        onMouseEnter={e => (e.currentTarget.style.opacity = '.7')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <Megaphone {...navIcon} />
      </Link>

      <Link
        href="/es/explora"
        style={linkStyle}
        onMouseEnter={e => (e.currentTarget.style.opacity = '.7')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <Compass {...navIcon} />
      </Link>

      <Link
        href="/es/deslizar/comprar"
        style={linkStyle}
        onMouseEnter={e => (e.currentTarget.style.opacity = '.7')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <ArrowLeftRight {...navIcon} />
      </Link>

      <Link
        href="/es/favoritos"
        style={linkStyle}
        onMouseEnter={e => (e.currentTarget.style.opacity = '.7')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <Heart {...navIcon} />
      </Link>

      <Link
        href="/soporte/ayuda"
        style={linkStyle}
        onMouseEnter={e => (e.currentTarget.style.opacity = '.7')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <CircleHelp {...navIcon} />
      </Link>

      <Link
        href="/en"
        style={linkStyle}
        onMouseEnter={e => (e.currentTarget.style.opacity = '.7')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <span
          style={{
            color: '#C7A44B',
            fontSize: '1.5rem',
            fontWeight: 100,
            letterSpacing: '.05em'
          }}
        >
          EN
        </span>
      </Link>

    </div>

  )

}