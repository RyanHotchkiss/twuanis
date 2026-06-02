'use client'

type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  breadcrumbs: BreadcrumbItem[]
}

export default function Breadcrumbs({
  breadcrumbs
}: {
  breadcrumbs: {
    label: string
    href?: string
  }[]
}) {

  return (

    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 0
      }}
    >

      {breadcrumbs.map((crumb, index) => {

        const isLast =
          index === breadcrumbs.length - 1

        return (

          <button
            key={crumb.label}
            onClick={() => {

              if (crumb.href) {
                window.location.href = crumb.href
              }

            }}
            style={{
              background:
                index === 0
                  ? '#FFFFFF25'
                  : index === 1
                  ? '#FFFFFF40'
                  : '#181818',

              border:
                index === 0
                  ? '.0625rem solid #ffffff50'
                  : index === 1
                  ? '.0625rem solid #ffffff50'
                  : '.0625rem solid #ffffff50',

              color:'#fff',

              borderTopRightRadius:
                isLast ? '.75rem' : 0,

              borderBottomRightRadius:
                isLast ? '.75rem' : 0,

              borderTopLeftRadius:
                index === 0 ? '.75rem' : 0,

              borderBottomLeftRadius:
                index === 0 ? '.75rem' : 0,

              marginRight:
                !isLast ? '0rem' : 0,

              position:'relative',

              zIndex:index + 1,

              padding:'.75rem 1rem',

              cursor:
                crumb.href
                  ? 'pointer'
                  : 'default',

              fontSize:'.875rem',

            
            }}
          >
            {crumb.label}
          </button>

        )

      })}

    </nav>

  )

}

const navButton = {
  background:'#FFFFFF50',
  border:'.0625rem solid #ffffff50',
  color:'#fff',
  borderRadius:'999rem',
  padding:'.85rem 1.25rem',
  fontWeight:'bold',
  cursor:'pointer',
  transition:'all .2s ease',
  backdropFilter:'blur(10px)'
}

/*
IMPORT EXAMPLE:

import Breadcrumbs from '@/app/components/Breadcrumbs'

USAGE EXAMPLE:

<Breadcrumbs
  breadcrumbs={[
    {
      label: 'Home',
      href: '/en/'
    },
    {
      label: 'Buy',
      href: '/en/buy'
    },
    {
      label: 'Listing'
    }
  ]}
/>
*/