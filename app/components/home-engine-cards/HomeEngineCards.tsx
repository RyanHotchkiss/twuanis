'use client'
import Link from 'next/link'
import {useEffect,useRef,useState} from 'react'
import {Compass,Ruler,Scale} from 'lucide-react'
import {homeCards,homeRows,cardUrl} from './catalog'
import styles from './cards.module.css'
import {useSiteTheme} from '../theme/ThemeProvider'
export default function HomeEngineCards({language,categoryPaging=false,initiallyOpen=false,intelligence=false,onInteract}:{language:'en'|'es';categoryPaging?:boolean;initiallyOpen?:boolean;intelligence?:boolean;onInteract?:()=>void}){
 const {theme}=useSiteTheme()
 const headingColor=intelligence?(theme==='dark'?'#ffffff':'#000000'):(theme==='dark'?'#000000':'#ffffff')
 const [category,setCategory]=useState(0)
 const [open,setOpen]=useState<string|null>(null)
 const [interacted,setInteracted]=useState(false)
 const viewport=useRef<HTMLDivElement>(null)
 const [height,setHeight]=useState<number>()
 useEffect(()=>{
   if(!categoryPaging)return
   const current=viewport.current?.querySelector<HTMLElement>(`[data-category-index="${category}"]`)
   if(!current)return
   if(window.innerWidth<=768){const track=current.querySelector<HTMLElement>('[data-engine-track]');if(track)track.scrollLeft=0}
   const measure=()=>setHeight(current.getBoundingClientRect().height)
   measure()
   const observer=new ResizeObserver(measure)
   observer.observe(current)
   return()=>observer.disconnect()
 },[category,categoryPaging])
 useEffect(()=>{
   if(!categoryPaging || !open || window.innerWidth>768)return
   const card=viewport.current?.querySelector<HTMLElement>(`[data-engine-card="${open}"]`)
   const track=card?.parentElement
   if(card && track){
     const cardBox=card.getBoundingClientRect(),trackBox=track.getBoundingClientRect()
     if(cardBox.left<trackBox.left)track.scrollLeft+=cardBox.left-trackBox.left
     else if(cardBox.right>trackBox.right)track.scrollLeft+=cardBox.right-trackBox.right
   }
 },[open,categoryPaging])
 const touch=useRef<{x:number;y:number}|null>(null)
 const change=(delta:number)=>{onInteract?.();setInteracted(true);setOpen(null);setCategory(i=>(i+delta+homeRows.length)%homeRows.length)}
 return <div className={`${styles.rows} ${intelligence ? styles.intelligence : ''} ${categoryPaging ? styles.paged : ''}`} data-home-engines data-heading-theme={theme} onKeyDownCapture={onInteract} onTouchStart={event=>{if(categoryPaging){onInteract?.();if(window.innerWidth<=768 && (event.target as HTMLElement).closest('[data-engine-track]')){touch.current=null;return}touch.current={x:event.touches[0].clientX,y:event.touches[0].clientY}}}} onTouchEnd={event=>{if(!categoryPaging||!touch.current)return;const dx=event.changedTouches[0].clientX-touch.current.x,dy=event.changedTouches[0].clientY-touch.current.y;touch.current=null;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)change(dx<0?1:-1)}}>
 {categoryPaging && <nav style={{color:headingColor}} className={styles.categoryControls} aria-label={language==='es'?'Categorías de análisis':'Analysis categories'}>
 <button type="button" style={{color:'#ff3b00'}} onClick={()=>change(-1)} aria-label={language==='es'?'Categoría anterior':'Previous category'}>‹</button>
 <span aria-live="polite">{category+1} / {homeRows.length}</span>
 <button type="button" style={{color:'#ff3b00'}} onClick={()=>change(1)} aria-label={language==='es'?'Categoría siguiente':'Next category'}>›</button>
 </nav>}<div ref={viewport} className={categoryPaging?styles.categoryViewport:undefined} style={categoryPaging?{height}:undefined}><div className={categoryPaging?styles.categoryTrack:undefined} style={categoryPaging?{transform:`translateX(-${category*100}%)`}:undefined}>{homeRows.map((row,index)=><section key={row.id} data-category-index={index} aria-hidden={categoryPaging && index!==category} inert={categoryPaging && index!==category} className={categoryPaging?styles.category:undefined} aria-labelledby={'home-row-'+row.id}><h2 style={{color:intelligence?headingColor:theme==='dark'?'#ff3b00':headingColor}} id={'home-row-'+row.id}><span className={styles.categoryTitle}>{row.heading[language]}</span></h2><div className={styles.grid} data-engine-track>{row.ids.map(id=>{const card=homeCards.find(c=>c.id===id)!,Icon=row.id==='market'?Compass:row.id==='comparison'?Scale:Ruler;return <Link prefetch={false} href={cardUrl(id,language)} key={id} data-engine-card={id} data-open={categoryPaging ? (open===id || (!interacted && initiallyOpen && index===0)) : undefined} onClick={event=>{if(!categoryPaging)return;onInteract?.();if(open!==id){event.preventDefault();setOpen(id)}setInteracted(true)}} className={styles.slot} style={{'--card-accent':row.color} as React.CSSProperties}><article className={styles.rest} aria-hidden="true"><Icon size={30} strokeWidth={.8}/><span>{card.name[language]}</span></article><article className={styles.expanded}><div className={styles.identity}><Icon size={30} strokeWidth={.8} aria-hidden="true"/><h3>{card.name[language]}</h3></div><p>{card.question[language]}</p><span className={styles.open}>{language==='es'?'Abrir análisis':'Open analysis'} →</span></article></Link>})}</div></section>)}</div></div></div>}
