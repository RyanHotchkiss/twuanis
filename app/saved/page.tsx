'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function SavedPage() {
  const [savedProperties, setSavedProperties] = useState<any[]>([])

  useEffect(() => {
    fetchSavedProperties()
  }, [])

  async function fetchSavedProperties() {

    // 1. Get saved rows
    const { data: saved } = await supabase
      .from('saved_properties')
      .select('*')

    if (!saved || saved.length === 0) {
      setSavedProperties([])
      return
    }

    // 2. Extract property IDs
    const ids = saved.map((item) => item.property_id)

    // 3. Get actual properties
    const { data: properties } = await supabase
      .from('properties')
      .select('*')
      .in('id', ids)

    setSavedProperties(properties || [])
  }

  return (
    <main style={{
      padding: '20px',
      background: '#000',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#fff' }}>Saved Properties</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '20px'
      }}>
        {savedProperties.map((property) => (
          <div
            key={property.id}
            style={{
              background: '#111',
              padding: '20px',
              borderRadius: '12px',
              color: '#fff'
            }}
          >
            <h2>{property.title}</h2>
            <p>{property.location}</p>

            <p style={{
              color: '#00ff99',
              fontWeight: 'bold'
            }}>
              ${property.price}
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}