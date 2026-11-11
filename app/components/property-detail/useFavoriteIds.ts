'use client'
import {useEffect,useState} from 'react'
import {supabase} from '@/lib/supabase'
import {getListingFavoriteIds} from '@/lib/account-storage'
import {propertyInteractionMessage} from '@/lib/property-interaction-errors'
/** Derived view of the one Saved Properties authority; never persists its own inventory. */
export function useFavoriteIds(language:'en'|'es'){
 const [favoriteIds,setFavoriteIds]=useState<string[]>([]),[favoriteError,setError]=useState('')
 useEffect(()=>{let active=true,generation=0
  async function refresh(){const version=++generation;try{const ids=await getListingFavoriteIds();if(active&&version===generation){setFavoriteIds(ids);setError('')}}catch(error){if(active&&version===generation)setError(propertyInteractionMessage(error,language))}}
  const update=()=>{void refresh()};update();window.addEventListener('favorites-updated',update)
  const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{++generation;setFavoriteIds([]);setError('');queueMicrotask(()=>{if(active)update()})})
  return()=>{active=false;++generation;subscription.unsubscribe();window.removeEventListener('favorites-updated',update)}
 },[language])
 return {favoriteIds,setFavoriteIds,favoriteError}
}
