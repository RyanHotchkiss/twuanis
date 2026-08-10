'use client'

import {
Archive,
CalendarDays,
ChevronDown,
Clock3,
Eye,
FilePenLine,
Forward,
Heart,
HousePlus,
MessageCircle,
Pencil,
Trash2
} from 'lucide-react'

import {
useEffect,
useState
} from 'react'

import {
supabase
} from '@/lib/supabase'

import {
  archiveListing,
  deleteListing,
  duplicateListing,
  restoreListing,
  unpublishListing
} from '@/app/utils/manageListing'

import PublishListingSheet from '@/app/components/PublishListingSheet'

import ListingOperationsCenter, {
  type ListingStatus,
  type ManagedListing
} from '@/app/components/ListingOperationsCenter'

import {
  prependListing,
  removeListing,
  replaceListing
} from '@/lib/listing-state'

import {
  loadCanonicalMarketHubListing
} from '@/app/utils/marketHubListing'

import type {
  ResolvedListingCapabilities
} from '@/lib/listing-capabilities'

type SupportedLanguage = 'en' | 'es'

export type MarketHubListing = {
id: string
title: string
status: ListingStatus

transactionType?:
| 'buy'
| 'rent'
| 'sale'

image?: string | null
location?: string | null
price?: string | null

viewCount?: number
favoriteCount?: number
shareCount?: number
whatsappClickCount?: number
emailInquiryCount?: number
daysSincePublished?: number
daysSinceLastUpdate?: number
}

type MarketHubMyListingsProps = {
language: SupportedLanguage
listings?: MarketHubListing[]
}

type PublishExistingListingResponse = {
success?: boolean

code?: string

error?: string

listing?: {
id: string
title: string | null
listing_status: string | null
transaction_type: string | null
published_at: string | null
updated_at: string | null
}
}

type RenewListingResponse = {
  success?: boolean

  code?: string

  error?: string

  listing?: {
    id: string
    title: string | null
    listing_status: string | null
    transaction_type: string | null
    created_at: string | null
    published_at: string | null
    renewed_at: string | null
    updated_at: string | null
    expired_at: string | null
  }
}

type PermanentDeleteListingResponse = {
success?: boolean
error?: string

listingId?: string
}

type ListingCapabilitiesResponse = {
  success?: boolean

  error?: string

  capabilities?:
    ResolvedListingCapabilities
}

export default function MarketHubMyListings({
language,
listings = []
}: MarketHubMyListingsProps) {

const [
currentListings,
setCurrentListings
] = useState<
MarketHubListing[]
>(listings)

const [
selectedListing,
setSelectedListing
] = useState<
MarketHubListing | null
>(null)

const [
operationsCenterOpen,
setOperationsCenterOpen
] = useState(false)

const [
managementError,
setManagementError
] = useState('')

const [
listingCapabilities,
setListingCapabilities
] = useState<
ResolvedListingCapabilities | null
>(null)

const [
capabilitiesLoading,
setCapabilitiesLoading
] = useState(false)

const [
capabilitiesError,
setCapabilitiesError
] = useState('')

useEffect(() => {
setCurrentListings(
listings
)
}, [
listings
])

const [
publishSheetOpen,
setPublishSheetOpen
] = useState(false)

const [
draftsOpen,
setDraftsOpen
] = useState(false)

const [
archivedOpen,
setArchivedOpen
] = useState(false)

const [
deletedOpen,
setDeletedOpen
] = useState(false)

const activeListings =
currentListings.filter(
listing =>
listing.status === 'active'
)

const draftListings =
currentListings.filter(
listing =>
listing.status === 'draft'
)

const archivedListings =
currentListings.filter(
listing =>
listing.status === 'archived'
)

const deletedListings =
currentListings.filter(
listing =>
listing.status === 'deleted'
)

const labels =
language === 'es'
? {
heading: 'Mis Publicaciones',
activeCount:
activeListings.length === 1
? 'Tiene 1 publicación activa.'
: `Tiene ${activeListings.length} publicaciones activas.`,
newListing: 'Publicar una Propiedad',
activeListings: 'Publicaciones Activas',
edit: 'Editar',
manage: 'Administrar',
empty:
'Todavía no tiene publicaciones activas.',
createFirst:
'Publique su primera propiedad.',
draftListings: 'Borradores',
archivedListings: 'Publicaciones Archivadas',
deletedListings: 'Publicaciones Eliminadas',
noDeleted: 'No tiene publicaciones eliminadas.',
openSection: 'Abrir sección',
closeSection: 'Cerrar sección',
continueEditing: 'Continuar Editando',
viewListing: 'Ver Publicación',
noDrafts: 'No tiene borradores.',
noArchived: 'No tiene publicaciones archivadas.',
views: 'Vistas',
favorites: 'Favoritos',
shares: 'Compartidos',
whatsappClicks: 'Clics en WhatsApp',
daysPublished: 'Días Publicada',
daysUpdated: 'Días desde la Actualización'
}
: {
heading: 'My Listings',
activeCount:
activeListings.length === 1
? 'You have 1 active listing.'
: `You have ${activeListings.length} active listings.`,
newListing: 'Publish a Property',
activeListings: 'Active Listings',
edit: 'Edit',
manage: 'Manage',
empty:
'You do not have any active listings yet.',
createFirst:
'Publish your first property.',
draftListings: 'Draft Listings',
archivedListings: 'Archived Listings',
deletedListings: 'Deleted Listings',
noDeleted: 'You do not have any deleted listings.',
openSection: 'Open section',
closeSection: 'Close section',
continueEditing: 'Continue Editing',
viewListing: 'View Listing',
noDrafts: 'You do not have any drafts.',
noArchived: 'You do not have any archived listings.',
views: 'Views',
favorites: 'Favorites',
shares: 'Shares',
whatsappClicks: 'WhatsApp Clicks',
daysPublished: 'Days Published',
daysUpdated: 'Days Since Update'
}

async function loadListingCapabilities(
  listingId: string
): Promise<void> {
  try {
    setCapabilitiesLoading(true)
    setCapabilitiesError('')

    const {
      data: {
        session
      },
      error:
        sessionError
    } =
      await supabase.auth
        .getSession()

    if (
      sessionError ||
      !session
    ) {
      throw new Error(
        language === 'es'
          ? 'Debe iniciar sesión para cargar las capacidades de esta publicación.'
          : 'You must be signed in to load this listing’s capabilities.'
      )
    }

    const response =
      await fetch(
        '/api/listing-capabilities',
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${session.access_token}`
          },

          body:
            JSON.stringify({
              listingId
            })
        }
      )

    const result =
      await response
        .json()
        .catch(
          () =>
            null
        ) as
          | ListingCapabilitiesResponse
          | null

    if (
      !response.ok ||
      !result?.success ||
      !result.capabilities
    ) {
      throw new Error(
        result?.error ||
        (
          language === 'es'
            ? 'No se pudieron cargar las capacidades de esta publicación.'
            : 'The listing’s capabilities could not be loaded.'
        )
      )
    }

    setListingCapabilities(
      result.capabilities
    )
  } catch (error) {
    console.error(
      'LISTING CAPABILITIES LOAD ERROR:',
      error
    )

    setListingCapabilities(
      null
    )

    setCapabilitiesError(
      error instanceof Error
        ? error.message
        : language === 'es'
          ? 'No se pudieron cargar las capacidades de esta publicación.'
          : 'The listing’s capabilities could not be loaded.'
    )
  } finally {
    setCapabilitiesLoading(
      false
    )
  }
}

function openOperationsCenter(
  listing:
    MarketHubListing
) {

  setSelectedListing(
    listing
  )

  setManagementError('')
  setCapabilitiesError('')

  setListingCapabilities(
    null
  )

  setOperationsCenterOpen(
    true
  )

  void loadListingCapabilities(
    listing.id
  )
}

async function handlePublish(
  listing: ManagedListing
): Promise<void> {
  try {
    setManagementError('')

    const {
      data: {
        session
      },
      error:
        sessionError
    } =
      await supabase.auth
        .getSession()

    if (
      sessionError ||
      !session
    ) {
      throw new Error(
        language === 'es'
          ? 'Debe iniciar sesión para publicar este anuncio.'
          : 'You must be signed in to publish this listing.'
      )
    }

    const response =
      await fetch(
        '/api/publish-existing-listing',
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${session.access_token}`
          },

          body:
            JSON.stringify({
              listingId:
                listing.id
            })
        }
      )

    const result =
      await response
        .json()
        .catch(
          () =>
            null
        ) as
          | PublishExistingListingResponse
          | null

    if (
      !response.ok ||
      !result?.success ||
      !result.listing
    ) {
      throw new Error(
        result?.error ||
        (
          language === 'es'
            ? 'No se pudo publicar el anuncio.'
            : 'The listing could not be published.'
        )
      )
    }

    const refreshedListing =
      await loadCanonicalMarketHubListing({
        supabase,

        listingId:
          result.listing.id,

        language
      })

    setCurrentListings(
      current =>
        replaceListing(
          current,
          refreshedListing
        )
    )

    setOperationsCenterOpen(
      false
    )

    setSelectedListing(
      null
    )

    setListingCapabilities(
      null
    )
  } catch (error) {
    console.error(
      'PUBLISH EXISTING LISTING ERROR:',
      error
    )

    setManagementError(
      error instanceof Error
        ? error.message
        : language === 'es'
          ? 'No se pudo publicar el anuncio.'
          : 'The listing could not be published.'
    )
  }
}

async function handleUnpublish(
listing:
ManagedListing
) {
try {
setManagementError('')

const updatedListing =
  await unpublishListing({
    supabase,

    listingId:
      listing.id
  })

const canonicalListing =
  await loadCanonicalMarketHubListing({
    supabase,

    listingId:
      updatedListing.id,

    language
  })

setCurrentListings(
  current =>
    replaceListing(
      current,
      canonicalListing
    )
)

setSelectedListing(
  canonicalListing
)

setDraftsOpen(true)

} catch (error) {
console.error(
'UNPUBLISH LISTING ERROR:',
error
)

setManagementError(
language === 'es'
? 'No se pudo despublicar la publicación.'
: 'The listing could not be unpublished.'
)
}
}

async function handleArchive(
listing:
ManagedListing
) {
try {
setManagementError('')

const updatedListing =
  await archiveListing({
    supabase,

    listingId:
      listing.id
  })

const canonicalListing =
  await loadCanonicalMarketHubListing({
    supabase,

    listingId:
      updatedListing.id,

    language
  })

setCurrentListings(
  current =>
    replaceListing(
      current,
      canonicalListing
    )
)

setSelectedListing(
  canonicalListing
)

setArchivedOpen(true)

} catch (error) {
console.error(
'ARCHIVE LISTING ERROR:',
error
)

setManagementError(
language === 'es'
? 'No se pudo archivar la publicación.'
: 'The listing could not be archived.'
)
}
}

async function handleRestore(
listing:
ManagedListing
) {
try {
setManagementError('')

const updatedListing =
  await restoreListing({
    supabase,

    listingId:
      listing.id
  })

const canonicalListing =
  await loadCanonicalMarketHubListing({
    supabase,

    listingId:
      updatedListing.id,

    language
  })

setCurrentListings(
  current =>
    replaceListing(
      current,
      canonicalListing
    )
)

setSelectedListing(
  canonicalListing
)

setDraftsOpen(true)

} catch (error) {
console.error(
'RESTORE LISTING ERROR:',
error
)

setManagementError(
language === 'es'
? 'No se pudo restaurar la publicación.'
: 'The listing could not be restored.'
)
}
}

async function handleRemove(
listing: ManagedListing
): Promise<void> {
try {
setManagementError('')

const updatedListing =
  await deleteListing({
    supabase,

    listingId:
      listing.id
  })

const canonicalListing =
  await loadCanonicalMarketHubListing({
    supabase,

    listingId:
      updatedListing.id,

    language
  })

setCurrentListings(
  current =>
    replaceListing(
      current,
      canonicalListing
    )
)

setSelectedListing(
  canonicalListing
)

setDeletedOpen(true)

} catch (error) {
console.error(
'DELETE LISTING ERROR:',
error
)

setManagementError(
language === 'es'
? 'No se pudo eliminar la publicación.'
: 'The listing could not be removed.'
)
}
}

async function handlePermanentDelete(
listing: ManagedListing
): Promise<void> {
try {
setManagementError('')

const {
data: {
session
},
error: sessionError
} =
await supabase.auth
.getSession()

if (
sessionError ||
!session
) {
throw new Error(
language === 'es'
? 'Debe iniciar sesión para eliminar permanentemente esta publicación.'
: 'You must be signed in to permanently delete this listing.'
)
}

const response =
await fetch(
'/api/permanently-delete-listing',
{
method: 'POST',

headers: {
'Content-Type':
'application/json',

Authorization:
`Bearer ${session.access_token}`
},

body:
JSON.stringify({
listingId:
listing.id
})
}
)

const result =
await response
.json()
.catch(
() =>
null
) as
| PermanentDeleteListingResponse
| null

if (
!response.ok ||
!result?.success
) {
throw new Error(
result?.error ||
(
language === 'es'
? 'No se pudo eliminar permanentemente la publicación.'
: 'The listing could not be permanently deleted.'
)
)
}

setCurrentListings(
current =>
removeListing(
current,
listing.id
)
)

setOperationsCenterOpen(
false
)

setSelectedListing(
null
)
} catch (error) {
console.error(
'PERMANENT DELETE LISTING ERROR:',
error
)

setManagementError(
error instanceof Error
? error.message
: language === 'es'
? 'No se pudo eliminar permanentemente la publicación.'
: 'The listing could not be permanently deleted.'
)
}
}

async function handleDuplicate(
  listing: ManagedListing
): Promise<void> {
  try {
    setManagementError('')

    const duplicate =
      await duplicateListing({
        supabase,

        listingId:
          listing.id
      })

    const canonicalDuplicate =
      await loadCanonicalMarketHubListing({
        supabase,

        listingId:
          duplicate.id,

        language
      })

    setCurrentListings(
      current =>
        prependListing(
          current,
          canonicalDuplicate
        )
    )

    setDraftsOpen(true)

    setOperationsCenterOpen(
      false
    )

    setSelectedListing(
      null
    )
  } catch (error) {
    console.error(
      'DUPLICATE LISTING ERROR:',
      error
    )

    setManagementError(
      error instanceof Error
        ? error.message
        : language === 'es'
          ? 'No se pudo duplicar la publicación.'
          : 'The listing could not be duplicated.'
    )
  }
}

async function handleRenew(
    listing: ManagedListing
  ): Promise<void> {
    try {
      setManagementError('')

      const {
        data: {
          session
        },
        error: sessionError
      } =
        await supabase.auth
          .getSession()

      if (
        sessionError ||
        !session
      ) {
        throw new Error(
          language === 'es'
            ? 'Debe iniciar sesión para renovar esta publicación.'
            : 'You must be signed in to renew this listing.'
        )
      }

      const response =
        await fetch(
          '/api/renew-listing',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${session.access_token}`
            },

            body:
              JSON.stringify({
                listingId:
                  listing.id
              })
          }
        )

      const result =
        await response
          .json()
          .catch(
            () =>
              null
          ) as
            | RenewListingResponse
            | null

      if (
        !response.ok ||
        !result?.success ||
        !result.listing
      ) {
        throw new Error(
          result?.error ||
            (
              language === 'es'
                ? 'No se pudo renovar la publicación.'
                : 'The listing could not be renewed.'
            )
        )
      }
      
      const refreshedListing =
        await loadCanonicalMarketHubListing({
          supabase,

          listingId:
            result.listing.id,

          language
        })

      setCurrentListings(
        current =>
          replaceListing(
            current,
            refreshedListing
          )
      )

      setOperationsCenterOpen(
        false
      )

      setSelectedListing(
        null
      )
    } catch (error) {
      console.error(
        'RENEW LISTING ERROR:',
        error
      )

      setManagementError(
        error instanceof Error
          ? error.message
          : language === 'es'
            ? 'No se pudo renovar la publicación.'
            : 'The listing could not be renewed.'
      )
    }
  }

return (
<section style={section}>
<header style={header}>
<div>
<h2 style={heading}>
{labels.heading}
</h2>

<p style={summary}>
{labels.activeCount}
</p>
</div>

<button
type="button"
onClick={() => {
setPublishSheetOpen(true)
}}
style={newListingButton}
>
<HousePlus
size={22}
strokeWidth={1}
/>

{labels.newListing}
</button>
</header>

<div style={divider} />

<h3 style={sectionHeading}>
{labels.activeListings}
<span style={count}>
{activeListings.length}
</span>
</h3>

{activeListings.length === 0 ? (
<div style={emptyState}>
<p style={emptyText}>
{labels.empty}
</p>

<button
type="button"
onClick={() => {
  setPublishSheetOpen(true)
}}
style={emptyLink}
>
{labels.createFirst}
</button>
</div>
) : (
<div style={listingGrid}>
{activeListings.map(listing => {

return (
<article
key={listing.id}
style={listingCard}
>
{listing.image ? (
<img
  src={listing.image}
  alt={listing.title}
  style={listingImage}
/>
) : (
<div style={imagePlaceholder}>
  <HousePlus
    size={34}
    strokeWidth={0.75}
    color="#C7A44B"
  />
</div>
)}

<div style={listingContent}>
<h4 style={listingTitle}>
  {listing.title}
</h4>

{listing.location && (
  <div style={listingMeta}>
    {listing.location}
  </div>
)}

{listing.price && (
  <div style={listingPrice}>
    {listing.price}
  </div>
)}

<div style={analyticsGrid}>
  <div style={analyticsItem}>
      <Eye
      size={18}
      strokeWidth={1}
      color="#C7A44B"
      />

      <div>
      <div style={analyticsValue}>
          {listing.viewCount ?? 0}
      </div>

      <div style={analyticsLabel}>
          {labels.views}
      </div>
      </div>
  </div>

  <div style={analyticsItem}>
      <Heart
      size={18}
      strokeWidth={1}
      color="#C7A44B"
      />

      <div>
      <div style={analyticsValue}>
          {listing.favoriteCount ?? 0}
      </div>

      <div style={analyticsLabel}>
          {labels.favorites}
      </div>
      </div>
  </div>

  <div style={analyticsItem}>
      <Forward
      size={18}
      strokeWidth={1}
      color="#C7A44B"
      />

      <div>
      <div style={analyticsValue}>
          {listing.shareCount ?? 0}
      </div>

      <div style={analyticsLabel}>
          {labels.shares}
      </div>
      </div>
  </div>

  <div style={analyticsItem}>
      <MessageCircle
      size={18}
      strokeWidth={1}
      color="#C7A44B"
      />

      <div>
      <div style={analyticsValue}>
          {listing.whatsappClickCount ?? 0}
      </div>

      <div style={analyticsLabel}>
          {labels.whatsappClicks}
      </div>
      </div>
  </div>

  

  <div style={analyticsItem}>
      <CalendarDays
      size={18}
      strokeWidth={1}
      color="#C7A44B"
      />

      <div>
      <div style={analyticsValue}>
          {listing.daysSincePublished ?? 0}
      </div>

      <div style={analyticsLabel}>
          {labels.daysPublished}
      </div>
      </div>
  </div>

  <div style={analyticsItem}>
      <Clock3
      size={18}
      strokeWidth={1}
      color="#C7A44B"
      />

      <div>
      <div style={analyticsValue}>
          {listing.daysSinceLastUpdate ?? 0}
      </div>

      <div style={analyticsLabel}>
          {labels.daysUpdated}
      </div>
      </div>
  </div>
  </div>

  <button
      type="button"
      onClick={() =>
        openOperationsCenter(
          listing
        )
      }
      style={
        manageButton
      }
    >
      <Pencil
        size={18}
        strokeWidth={1}
      />

      {
        labels.manage
      }
</button>


</div>
</article>
)
})}
</div>
)}

<div style={secondarySection}>
<button
type="button"
onClick={() => {
setDraftsOpen(
current => !current
)
}}
style={sectionToggle}
aria-expanded={draftsOpen}
>
<div style={sectionToggleTitle}>
<FilePenLine
size={21}
strokeWidth={1}
color="#C7A44B"
/>

<span>
{labels.draftListings}
</span>

<span style={count}>
{draftListings.length}
</span>
</div>

<ChevronDown
size={21}
strokeWidth={1}
style={{
transform: draftsOpen
? 'rotate(180deg)'
: 'rotate(0deg)',
transition:
'transform .2s ease'
}}
/>
</button>

{draftsOpen && (
<div style={collapsibleContent}>
{draftListings.length === 0 ? (
<div style={secondaryEmpty}>
{labels.noDrafts}
</div>
) : (
<div style={listingGrid}>
{draftListings.map(
  listing => {
  
  return (
      <article
      key={listing.id}
      style={listingCard}
      >
      {listing.image ? (
          <img
          src={listing.image}
          alt={listing.title}
          style={listingImage}
          />
      ) : (
          <div
          style={
              imagePlaceholder
          }
          >
          <FilePenLine
              size={34}
              strokeWidth={0.75}
              color="#C7A44B"
          />
          </div>
      )}

      <div
          style={listingContent}
      >
          <h4
          style={listingTitle}
          >
          {listing.title}
          </h4>

          {listing.location && (
          <div
              style={listingMeta}
          >
              {listing.location}
          </div>
          )}

        <button
            type="button"
            onClick={() =>
              openOperationsCenter(
                listing
              )
            }
            style={
              manageButton
            }
          >
            <Pencil
              size={18}
              strokeWidth={1}
            />

            {
              labels.manage
            }
      </button>
      </div>
      </article>
  )
  }
)}
</div>
)}
</div>
)}
</div>
<div style={secondarySection}>
<button
type="button"
onClick={() => {
setArchivedOpen(
current => !current
)
}}
style={sectionToggle}
aria-expanded={archivedOpen}
>
<div style={sectionToggleTitle}>
<Archive
size={21}
strokeWidth={1}
color="#C7A44B"
/>

<span>
{labels.archivedListings}
</span>

<span style={count}>
{archivedListings.length}
</span>
</div>

<ChevronDown
size={21}
strokeWidth={1}
style={{
transform: archivedOpen
? 'rotate(180deg)'
: 'rotate(0deg)',
transition:
'transform .2s ease'
}}
/>
</button>

{archivedOpen && (
<div style={collapsibleContent}>
{archivedListings.length === 0 ? (
<div style={secondaryEmpty}>
{labels.noArchived}
</div>
) : (
<div style={listingGrid}>
{archivedListings.map(
  listing => {
  
  return (
      <article
      key={listing.id}
      style={listingCard}
      >
      {listing.image ? (
          <img
          src={listing.image}
          alt={listing.title}
          style={listingImage}
          />
      ) : (
          <div
          style={
              imagePlaceholder
          }
          >
          <Archive
              size={34}
              strokeWidth={0.75}
              color="#C7A44B"
          />
          </div>
      )}

      <div
          style={listingContent}
      >
          <h4
          style={listingTitle}
          >
          {listing.title}
          </h4>

          {listing.location && (
          <div
              style={listingMeta}
          >
              {listing.location}
          </div>
          )}

          <button
                type="button"
                onClick={() =>
                  openOperationsCenter(
                    listing
                  )
                }
                style={
                  manageButton
                }
              >
                {
                  labels.manage
                }
          </button>

      </div>
      </article>
  )
  }
)}
</div>
)}
</div>
)}
</div>

<div style={secondarySection}>
<button
type="button"
onClick={() => {
setDeletedOpen(
current => !current
)
}}
style={sectionToggle}
aria-expanded={deletedOpen}
>
<div style={sectionToggleTitle}>
<Trash2
size={21}
strokeWidth={1}
color="#dc143c"
/>

<span>
{labels.deletedListings}
</span>

<span style={count}>
{deletedListings.length}
</span>
</div>

<ChevronDown
size={21}
strokeWidth={1}
style={{
transform:
deletedOpen
  ? 'rotate(180deg)'
  : 'rotate(0deg)',

transition:
'transform .2s ease'
}}
/>
</button>

{deletedOpen && (
<div style={collapsibleContent}>
{deletedListings.length === 0 ? (
<div style={secondaryEmpty}>
{labels.noDeleted}
</div>
) : (
<div style={listingGrid}>
{deletedListings.map(
  listing => (
    <article
      key={listing.id}
      style={{
        ...listingCard,
        borderColor:
          'rgba(220, 20, 60, .35)'
      }}
    >
      {listing.image ? (
        <img
          src={listing.image}
          alt={listing.title}
          style={{
            ...listingImage,
            opacity: 0.55
          }}
        />
      ) : (
        <div
          style={
            imagePlaceholder
          }
        >
          <Trash2
            size={34}
            strokeWidth={0.75}
            color="#dc143c"
          />
        </div>
      )}

      <div style={listingContent}>
        <h4 style={listingTitle}>
          {listing.title}
        </h4>

        {listing.location && (
          <div style={listingMeta}>
            {listing.location}
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            openOperationsCenter(
              listing
            )
          }
          style={manageButton}
        >
          <Pencil
            size={18}
            strokeWidth={1}
          />

          {labels.manage}
        </button>
      </div>
    </article>
  )
)}
</div>
)}
</div>
)}
</div>

{managementError && (
<div
style={managementErrorBox}
>
{managementError}
</div>
)}

<PublishListingSheet
language={language}
open={
operationsCenterOpen
}
onClose={() => {
setPublishSheetOpen(false)
}}
/>

<ListingOperationsCenter
language={language}
open={
operationsCenterOpen
}
listing={
selectedListing
}
capabilities={
listingCapabilities
}
capabilitiesLoading={
capabilitiesLoading
}
capabilitiesError={
capabilitiesError
}
onClose={() => {
  setOperationsCenterOpen(
    false
  )

  setSelectedListing(
    null
  )

  setListingCapabilities(
    null
  )

  setCapabilitiesLoading(
    false
  )

  setCapabilitiesError('')
}}
onPublish={
handlePublish
}
onDuplicate={
handleDuplicate
}
onRenew={
handleRenew
}
onUnpublish={
handleUnpublish
}
onArchive={
handleArchive
}
onRestore={
handleRestore
}
onRemove={
handleRemove
}
onPermanentDelete={
handlePermanentDelete
}
/>

</section>
)
}

const section = {
padding: '1.5rem',
background: '#151515',
border: '1px solid #303030',
borderRadius: '18px'
}

const header = {
display: 'flex',
flexWrap: 'wrap' as const,
alignItems: 'center',
justifyContent: 'space-between',
gap: '1rem'
}

const heading = {
margin: 0,
color: '#fff',
fontSize: '1.75rem',
lineHeight: 1.2
}

const summary = {
margin: '.45rem 0 0',
color: '#999',
fontSize: '.95rem'
}

const newListingButton = {
display: 'inline-flex',
alignItems: 'center',
justifyContent: 'center',
gap: '.55rem',
padding: '.8rem 1rem',
color: '#C7A44B',
background: '#1d1d1d',
borderRadius: '10px',
border: '1px solid #C7A44B',
cursor: 'pointer',
fontFamily: 'inherit',   
textDecoration: 'none',
fontWeight: 600
}

const divider = {
height: '1px',
margin: '1.5rem 0',
background: '#303030'
}

const sectionHeading = {
display: 'flex',
alignItems: 'center',
gap: '.6rem',
margin: '0 0 1rem',
color: '#ff3b00',
fontSize: '1.1rem'
}

const count = {
display: 'inline-flex',
alignItems: 'center',
justifyContent: 'center',
minWidth: '1.7rem',
height: '1.7rem',
padding: '0 .45rem',
color: '#fff',
background: '#292929',
borderRadius: '999px',
fontSize: '.78rem'
}

const emptyState = {
padding: '2rem',
textAlign: 'center' as const,
background: '#191919',
border: '1px dashed #3a3a3a',
borderRadius: '14px'
}

const emptyText = {
margin: 0,
color: '#999'
}

const emptyLink = {
display: 'inline-block',
marginTop: '.85rem',
color: '#C7A44B',
padding: 0,
background: 'transparent',
border: 'none',
cursor: 'pointer',
fontFamily: 'inherit',
fontWeight: 600
}

const listingGrid = {
display: 'grid',
gridTemplateColumns:
'repeat(auto-fit, minmax(250px, 1fr))',
gap: '1rem'
}

const listingCard = {
overflow: 'hidden',
background: '#1b1b1b',
border: '1px solid #303030',
borderRadius: '14px'
}

const listingImage = {
display: 'block',
width: '100%',
height: '170px',
objectFit: 'cover' as const
}

const imagePlaceholder = {
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
width: '100%',
height: '170px',
background: '#111'
}

const listingContent = {
padding: '1rem'
}

const listingTitle = {
margin: 0,
color: '#fff',
fontSize: '1.05rem',
lineHeight: 1.35
}

const listingMeta = {
marginTop: '.45rem',
color: '#888',
fontSize: '.85rem'
}

const listingPrice = {
marginTop: '.45rem',
color: '#C7A44B',
fontSize: '.95rem',
fontWeight: 600
}

const secondarySection = {
marginTop: '1rem',
background: '#191919',
border: '1px solid #303030',
borderRadius: '14px',
overflow: 'hidden'
}

const sectionToggle = {
width: '100%',
display: 'flex',
alignItems: 'center',
justifyContent: 'space-between',
gap: '1rem',
padding: '1rem',
color: '#fff',
background: 'transparent',
border: 'none',
cursor: 'pointer',
fontFamily: 'inherit',
textAlign: 'left' as const
}

const sectionToggleTitle = {
display: 'flex',
alignItems: 'center',
gap: '.65rem',
fontSize: '1rem',
fontWeight: 600
}

const collapsibleContent = {
padding: '0 1rem 1rem'
}

const secondaryEmpty = {
padding: '1.25rem',
color: '#888',
textAlign: 'center' as const,
background: '#161616',
border: '1px dashed #333',
borderRadius: '10px'
}

const analyticsGrid = {
display: 'grid',
gridTemplateColumns:
'repeat(auto-fit, minmax(115px, 1fr))',
gap: '.7rem',
marginTop: '1rem',
paddingTop: '1rem',
borderTop: '1px solid #303030'
}

const analyticsItem = {
display: 'grid',
gridTemplateColumns: 'auto 1fr',
alignItems: 'center',
gap: '.55rem',
minWidth: 0,
padding: '.6rem',
background: '#171717',
border: '1px solid #292929',
borderRadius: '9px'
}

const analyticsValue = {
color: '#fff',
fontSize: '.95rem',
fontWeight: 700,
lineHeight: 1.1
}

const analyticsLabel = {
marginTop: '.15rem',
color: '#808080',
fontSize: '.68rem',
lineHeight: 1.25
}

const manageButton = {
display: 'inline-flex',
alignItems: 'center',
gap: '.45rem',    
marginTop: '1rem',
padding: 0,
color: '#ddd',
background: 'transparent',
border: 0,
fontFamily: 'inherit',
fontSize: '.9rem',
cursor: 'pointer'
}

const managementErrorBox = {
marginTop: '1rem',
padding: '1rem',
color: '#ffb4b4',
background: '#2a1010',
border:
'1px solid #6b2222',
borderRadius: '10px'
}