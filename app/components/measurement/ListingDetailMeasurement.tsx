'use client'
import {useListingMeasurement} from './useListingMeasurement'
import {useListingSections} from './useListingSections'

// The server renders this only after the existing public reader permits delivery.
export default function ListingDetailMeasurement({id,locale,market}:{id:string;locale:'en'|'es';market:'private'|'bank'}){
 const ref=useListingMeasurement(id,locale,market,'view','heading')
 useListingSections(id)
 return <span hidden ref={node=>{ref.current=node}}/>
}
