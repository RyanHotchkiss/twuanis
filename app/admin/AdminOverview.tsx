'use client'
import {useEffect,useState} from 'react'
import {adminRead} from './actions'
import type {AdminLanguage} from './admin-contract'
export default function AdminOverview({language}:{language:AdminLanguage}){
 const [counts,setCounts]=useState<Record<string,string>|null>(null),[failed,setFailed]=useState(false)
 useEffect(()=>{let live=true;adminRead({mode:'overview'}).then(r=>{if(live){if(r.ok)setCounts(r.data);else setFailed(true)}});return()=>{live=false}},[])
 const labels=language==='es'?{total:'Propiedades',active:'Activas',archived:'Archivadas',sale:'Venta',rent:'Alquiler'}:{total:'Listings',active:'Active',archived:'Archived',sale:'Sale',rent:'Rent'}
 return <section>{failed?<p role="alert">{language==='es'?'No se pudo obtener el resumen.':'The overview could not be loaded.'}</p>:!counts?<p role="status">{language==='es'?'Cargando…':'Loading…'}</p>:<dl className="admin-filters">{Object.entries(labels).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{counts[key]}</dd></div>)}</dl>}</section>
}
