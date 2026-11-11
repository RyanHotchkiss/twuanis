'use client'
import {productAction} from '@/lib/measurement/journey-client'
import {useEffect,useRef,useState} from 'react'
import styles from './PropertyDetailGallery.module.css'
import detailStyles from './PropertyDetailLayout.module.css'
export default function PropertyDetailGallery({images,title,language}:{images:string[];title:string;language:'en'|'es'}){
 const [expanded,setExpanded]=useState<number|null>(null)
 const viewer=useRef<HTMLDialogElement>(null)
 const [mobile,setMobile]=useState(false)
 useEffect(()=>{const media=window.matchMedia('(max-width: 768px)');const reset=()=>{setMobile(media.matches);if(!media.matches)setExpanded(null)};reset();media.addEventListener('change',reset);return()=>media.removeEventListener('change',reset)},[])
 useEffect(()=>{
  const dialog=viewer.current
  if(expanded===null||!dialog)return
  const prior=document.activeElement as HTMLElement|null,body=document.body
  const overflow=body.style.overflow,padding=body.style.paddingRight
  const gap=window.innerWidth-document.documentElement.clientWidth
  if(gap>0)body.style.paddingRight=`${parseFloat(getComputedStyle(body).paddingRight)+gap}px`
  body.style.overflow='hidden';dialog.showModal()
  return()=>{dialog.close();body.style.overflow=overflow;body.style.paddingRight=padding;if(prior?.isConnected)prior.focus({preventScroll:true})}
 },[expanded])
 const index=0
 const open=(i:number)=>{setExpanded(i);productAction('listing_photo_select','discovery','acknowledged')}
 const primary=images[index]?<img className={styles.primary} referrerPolicy="no-referrer" src={images[index]} alt={title} style={{width:'100%',aspectRatio:'4 / 3',objectFit:'cover',display:'block'}}/>:null
 return <div data-property-gallery><div style={{borderRadius:'1.5rem',overflow:'hidden',marginBottom:'1rem',background:'var(--surface)'}}>{primary?(mobile?<button type="button" className={styles.primaryButton} aria-label={language==='es'?'Ampliar fotografía':'Enlarge photograph'} onClick={()=>open(index)}>{primary}</button>:primary):<div style={{height:'34rem',display:'flex',justifyContent:'center',alignItems:'center',color:'var(--muted)'}}>{language==='es'?'Sin Imagen':'No Image'}</div>}</div>{images.length>1&&<div className={`${detailStyles.thumbnails} ${styles.thumbnails}`} style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:'1rem'}}>{images.map((image,i)=>i===index?null:mobile?<button type="button" key={i} className={styles.thumbnail} aria-label={`${language==='es'?'Ver fotografía':'View photograph'} ${i+1}`} onClick={()=>{if(window.matchMedia('(max-width: 768px)').matches){open(i)}}}><img referrerPolicy="no-referrer" src={image} alt="" style={{width:'100%',height:'8rem',objectFit:'cover',borderRadius:'1rem',border:'1px solid var(--border)'}}/></button>:<img key={i} referrerPolicy="no-referrer" src={image} alt="" style={{width:'100%',height:'8rem',objectFit:'cover',borderRadius:'1rem',border:'1px solid var(--border)'}}/>)}</div>}{expanded!==null&&images[expanded]&&<dialog ref={viewer} className={styles.viewer} aria-label={language==='es'?'Fotografía de la propiedad':'Property photograph'} onCancel={e=>{e.preventDefault();setExpanded(null)}} onClose={()=>setExpanded(null)}><button type="button" className={styles.close} onClick={()=>setExpanded(null)}>{language==='es'?'Cerrar':'Close'} ×</button><img referrerPolicy="no-referrer" src={images[expanded]} alt={title}/></dialog>}</div>
}
