'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function SwipePage() {

  const [properties, setProperties] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)

  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    fetchProperties()
  }, [])

  async function fetchProperties() {
    const { data } = await supabase
      .from('properties')
      .select('*')

    setProperties(data || [])
  }

  async function saveProperty(propertyId: string) {
    await supabase
      .from('saved_properties')
      .insert({
        property_id: propertyId
      })
  }

async function completeSwipe(direction: 'left' | 'right') {

  const currentProperty = properties[currentIndex]

  if (!currentProperty) return

  // SAVE RIGHT SWIPES
  if (direction === 'right') {
    await saveProperty(currentProperty.id)
  }

  // START LEAVING ANIMATION
  setIsLeaving(true)

  // THROW CARD OFF SCREEN
  setDragX(direction === 'right' ? 1000 : -1000)

  // WAIT FOR ANIMATION
  setTimeout(() => {

    // NEXT CARD
    setCurrentIndex((prev) => prev + 1)

    // RESET CARD STATE
    setDragX(0)
    setIsLeaving(false)

  }, 280)
}

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    setIsDragging(true)
    setStartX(e.clientX)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return

    setDragX(e.clientX - startX)
  }

  function handlePointerUp() {

    setIsDragging(false)

    if (dragX > 80) {
      completeSwipe('right')
    } else if (dragX < -80) {
      completeSwipe('left')
    } else {
      setDragX(0)
    }
  }

  const currentProperty = properties[currentIndex]
  const nextProperty = properties[currentIndex + 1]

  const rotation = dragX / 20

  // END
  if (!currentProperty) {
    return (
      <main style={{
        background: '#000',
        color: '#fff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px'
      }}>
        <h1>No More Properties</h1>

        <a
          href="/saved"
          style={{
            color: '#00ff99',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          View Saved Properties
        </a>
      </main>
    )
  }

  return (
  <main style={{
    background: '#000',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    padding: '20px'
  }}>

    {/* TOP NAV */}
    <div style={{
      position: 'absolute',
      top: '20px',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      gap: '30px',
      zIndex: 10
    }}>
      <a
        href="/"
        style={{
          color: '#fff',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}
      >
        Grid
      </a>

      <a
        href="/saved"
        style={{
          color: '#00ff99',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}
      >
        Saved Properties
      </a>
    </div>

    {/* NEXT CARD */}
    {nextProperty && (
      <div style={{
        position: 'absolute',
        width: '100%',
        maxWidth: '400px',
        background: '#1a1a1a',
        borderRadius: '20px',
        padding: '20px',
        color: '#fff',
        transform: 'scale(.95) translateY(10px)',
        opacity: .7,
        zIndex: 1
      }}>
        <div style={{
          height: '300px',
          background: '#222',
          borderRadius: '12px',
          marginBottom: '20px'
        }} />

        <h2>{nextProperty.title}</h2>
      </div>
    )}

    {/* ACTIVE CARD */}
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        maxWidth: '400px',
        background: '#111',
        borderRadius: '20px',
        padding: '20px',
        color: '#fff',
        textAlign: 'center',
        boxShadow: '0 0 40px rgba(0,0,0,.6)',
        transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
        transition: isDragging
          ? 'none'
          : 'transform 220ms ease',
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none'
      }}
    >

      {/* SAVE */}
      {dragX > 40 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          color: '#00ff99',
          fontSize: '32px',
          fontWeight: 'bold'
        }}>
          SAVE
        </div>
      )}

      {/* NOPE */}
      {dragX < -40 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          color: '#ff4444',
          fontSize: '32px',
          fontWeight: 'bold'
        }}>
          NOPE
        </div>
      )}

      {/* IMAGE */}
      <div style={{
        height: '300px',
        background: '#222',
        borderRadius: '12px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#777'
      }}>
        Property Image
      </div>

      <h1>{currentProperty.title}</h1>

      <p>{currentProperty.location}</p>

      <p style={{
        color: '#00ff99',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        ${currentProperty.price}
      </p>

      {/* BUTTONS */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '30px'
      }}>
        <button
          onClick={() => completeSwipe('left')}
          style={{
            background: '#ff4444',
            border: 'none',
            color: '#fff',
            padding: '14px 24px',
            borderRadius: '999px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Reject
        </button>

        <button
          onClick={() => completeSwipe('right')}
          style={{
            background: '#00ff99',
            border: 'none',
            color: '#000',
            padding: '14px 24px',
            borderRadius: '999px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Save
        </button>
      </div>

    </div>
  </main>
)
}