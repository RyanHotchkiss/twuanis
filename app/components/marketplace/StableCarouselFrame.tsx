'use client'
import {createContext,useContext,type ReactNode} from 'react'
const CarouselSlideActive=createContext(true)
export const useCarouselSlideActive=()=>useContext(CarouselSlideActive)
// All slides participate in the same intrinsic grid track. The browser measures
// the maximum at the actual card width before paint, including queued slides.
// No duplicate measurement tree, fixed height, or resize feedback loop is needed.
export default function StableCarouselFrame({slides,active}:{slides:{id:string;content:ReactNode}[];active:number}){
 return <div data-stable-carousel style={{display:'grid',gridTemplateColumns:'minmax(0, 1fr)',alignItems:'start',width:'100%',minWidth:0}}>
  {slides.map((slide,i)=><div key={slide.id} data-carousel-slide data-carousel-active={i===active} aria-hidden={i!==active||undefined} inert={i!==active} style={{gridArea:'1 / 1',minWidth:0,visibility:i===active?'visible':'hidden'}}><CarouselSlideActive.Provider value={i===active}>{slide.content}</CarouselSlideActive.Provider></div>)}
 </div>
}
