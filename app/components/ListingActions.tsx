'use client'

import {
  useState
} from 'react'

import {
  recordListingSaved,
  recordListingShared
} from '@/lib/activity'

type ListingActionsProps = {
  listingId: string
  title?: string | null
  province?: string | null
  canton?: string | null
  district?: string | null
  propertyType?: string | null
  transactionType:
    | 'buy'
    | 'rent'
    | 'lease'
  language:
    | 'en'
    | 'es'
}

export default function ListingActions({
  listingId,
  title,
  province,
  canton,
  district,
  propertyType,
  transactionType,
  language
}: ListingActionsProps) {
  const [saved, setSaved] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const labels =
    language === 'es'
      ? {
          save: 'Guardar',
          saved: 'Guardada',
          share: 'Compartir',
          copied: 'Enlace Copiado',
          error: 'No se pudo completar la acción.'
        }
      : {
          save: 'Save',
          saved: 'Saved',
          share: 'Share',
          copied: 'Link Copied',
          error: 'The action could not be completed.'
        }

  function getMetadata() {
        return {
            title: title ?? undefined,
            province: province ?? undefined,
            canton: canton ?? undefined,
            district: district ?? undefined,
            propertyType:
            propertyType ?? undefined,
            transactionType,
            pathname:
            window.location.pathname,
            href:
            window.location.href
        }
        }

  async function handleSave() {
    try {
      await recordListingSaved({
        listingId,
        metadata:
          getMetadata()
      })

      setSaved(true)
      setMessage('')
    } catch (error) {
      console.error(
        'LISTING SAVE ERROR:',
        error
      )

      setMessage(
        labels.error
      )
    }
  }

  async function handleShare() {
    try {
      const shareData = {
        title:
          title || 'Twuanis',
        url:
          window.location.href
      }

      let shareMethod =
        'clipboard'

      if (navigator.share) {
        await navigator.share(
          shareData
        )

        shareMethod =
          'native'
      } else {
        await navigator.clipboard.writeText(
          window.location.href
        )

        setMessage(
          labels.copied
        )
      }

      await recordListingShared({
        listingId,
        metadata: {
          ...getMetadata(),
          shareMethod
        }
      })
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === 'AbortError'
      ) {
        return
      }

      console.error(
        'LISTING SHARE ERROR:',
        error
      )

      setMessage(
        labels.error
      )
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '.75rem',
        marginBottom: '1.5rem'
      }}
    >
      <button
        type="button"
        onClick={handleSave}
        disabled={saved}
        style={{
          flex: 1,
          minWidth: '8rem',
          border: '1px solid #fff',
          borderRadius: '999px',
          padding: '.85rem 1.25rem',
          background:
            saved
              ? '#fff'
              : 'transparent',
          color:
            saved
              ? '#000'
              : '#fff',
          cursor:
            saved
              ? 'default'
              : 'pointer',
          fontWeight: 'bold'
        }}
      >
        {saved
          ? labels.saved
          : labels.save}
      </button>

      <button
        type="button"
        onClick={handleShare}
        style={{
          flex: 1,
          minWidth: '8rem',
          border: '1px solid #fff',
          borderRadius: '999px',
          padding: '.85rem 1.25rem',
          background: '#fff',
          color: '#000',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {labels.share}
      </button>

      {message && (
        <div
          style={{
            width: '100%',
            color: '#aaa',
            fontSize: '.9rem'
          }}
        >
          {message}
        </div>
      )}
    </div>
  )
}