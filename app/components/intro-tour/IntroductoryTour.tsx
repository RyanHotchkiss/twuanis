"use client"
import {useEffect,useRef,useState} from 'react'
import {usePathname,useRouter,useSearchParams} from 'next/navigation'
import {useHomepageEntrance} from '../HomepageEntrance'
import {introScenes,spanishIntroScenes,INTRO_RECORDINGS,INTRO_VERSION,SPANISH_UTILITY_NARRATION,narrationReference,type IntroLocale} from './manifest'
import './tour.css'
const emit=(name:string,detail:unknown)=>window.dispatchEvent(new CustomEvent(name,{detail}))
export default function IntroductoryTour(){
 const path=usePathname(),search=useSearchParams(),router=useRouter(),entrance=useHomepageEntrance()
 const [launcherCompact,setLauncherCompact]=useState(false)
 const launcherTimer=useRef<number|null>(null)
 useEffect(()=>{setLauncherCompact(false);if(path!=='/en'&&path!=='/es')return;launcherTimer.current=window.setTimeout(()=>{launcherTimer.current=null;setLauncherCompact(true)},20000);return()=>{if(launcherTimer.current!==null){clearTimeout(launcherTimer.current);launcherTimer.current=null}}},[path])
 const [active,setActive]=useState(false),[finished,setFinished]=useState(false),[locale,setLocale]=useState<IntroLocale>('en'),[index,setIndex]=useState(0),[stage,setStage]=useState<'control'|'destination'>('control'),[paused,setPaused]=useState(false),[muted,setMuted]=useState(false),[ready,setReady]=useState(false),[issue,setIssue]=useState(''),[rect,setRect]=useState<{top:number;left:number;width:number;height:number}|null>(null)
 const [audioBlocked,setAudioBlocked]=useState(false),audio=useRef<HTMLAudioElement>(null),dialog=useRef<HTMLDivElement>(null),nextButton=useRef<HTMLButtonElement>(null),opener=useRef<HTMLElement|null>(null)
 const scenes=locale==='es'?spanishIntroScenes:introScenes
 const home='/'+locale,scene=scenes[index],es=locale==='es',closing=es&&scene.id==='C01',t=(en:string,sp:string)=>es?sp:en
 // Owner policy follows visible progress numbers, independent of locale and scene IDs.
 const directNext=[3,4,5,7,8,9].includes(index+1),hideSkip=[1,2,10,11,12,13].includes(index+1)
 const visitsDestination=stage==='control'&&!!scene.destination
 const targetRoute=stage==='control'?home:scene.destination?.[locale]??home
 const currentRoute=path+(search.size?'?'+search.toString():'')
 const utilityCue=es&&stage==='control'?SPANISH_UTILITY_NARRATION.cues.find(cue=>cue.id===scene.id):undefined
 const continuous=!!utilityCue
 const [utilityReady,setUtilityReady]=useState(false)
 const pendingSeek=useRef<number|null>(null),cutoffTimer=useRef<ReturnType<typeof setTimeout>|null>(null)
 const recording=continuous?SPANISH_UTILITY_NARRATION.src:INTRO_RECORDINGS[narrationReference(locale,scene.id,stage)]
 const playbackReady=continuous?utilityReady:ready,playbackKey=continuous?'spanish-utilities':`${index}-${stage}`
 function clearCutoff(){if(cutoffTimer.current!==null){clearTimeout(cutoffTimer.current);cutoffTimer.current=null}}
 function finishUtilities(){const element=audio.current;clearCutoff();element?.pause();if(element)element.currentTime=SPANISH_UTILITY_NARRATION.end;pendingSeek.current=null;setReady(false);setIndex(scenes.findIndex(item=>item.id==='C01'));setStage('control')}
 function syncUtilities(){
  const element=audio.current;if(!continuous||!element||pendingSeek.current!==null)return
  if(element.currentTime>=SPANISH_UTILITY_NARRATION.end){finishUtilities();return}
  const cue=SPANISH_UTILITY_NARRATION.cues.findLast(item=>element.currentTime>=item.start)
  if(cue&&cue.id!==scene.id){setIndex(scenes.findIndex(item=>item.id===cue.id));setStage('control')}
 }
 function scheduleCutoff(){
  clearCutoff();const element=audio.current
  if(!continuous||!element||element.paused||element.seeking||pendingSeek.current!==null)return
  const remaining=SPANISH_UTILITY_NARRATION.end-element.currentTime
  if(remaining<=0){finishUtilities();return}
  const boundary=SPANISH_UTILITY_NARRATION.cues.find(item=>item.start>element.currentTime)?.start??SPANISH_UTILITY_NARRATION.end
  cutoffTimer.current=setTimeout(()=>{syncUtilities();scheduleCutoff()},Math.max(1,(boundary-element.currentTime)/element.playbackRate*1000))
 }
 function seekNarration(time:number){
  pendingSeek.current=time;const element=audio.current
  if(element&&element.readyState>=1&&element.getAttribute('src')===SPANISH_UTILITY_NARRATION.src){element.currentTime=time;pendingSeek.current=null}
  scheduleCutoff()
 }
 function previous(){
  const previousIndex=stage==='destination'?index:Math.max(0,index-1)
  const cue=es&&stage==='control'?SPANISH_UTILITY_NARRATION.cues.find(item=>item.id===scenes[previousIndex].id):undefined
  if(cue)seekNarration(cue.start);else{audio.current?.pause();pendingSeek.current=null}
  setReady(false);if(stage==='destination')setStage('control');else setIndex(previousIndex)
 }
 function replay(){audio.current?.pause();if(continuous)seekNarration(utilityCue!.start);else if(audio.current)audio.current.currentTime=0;setPaused(false);if(recording&&playbackReady)audio.current?.play().catch(()=>setAudioBlocked(true))}
 useEffect(()=>{if(!continuous)setUtilityReady(false)},[continuous])
 useEffect(()=>{if(continuous&&ready)setUtilityReady(true)},[continuous,ready])
 useEffect(()=>()=>clearCutoff(),[])
 const caption=stage==='destination'?scene.destinationCaption?.[locale]??scene.caption[locale]:scene.caption[locale]
 function stop(completed=false){clearCutoff();pendingSeek.current=null;audio.current?.pause();setActive(false);setFinished(completed);setRect(null);if(!(completed&&es))router.push(home,{scroll:true})}
 function advance(skip=false){if(!active||paused||(!ready&&!skip))return;if(continuous){const nextCue=SPANISH_UTILITY_NARRATION.cues.find(item=>item.id===scenes[index+1]?.id);if(nextCue){seekNarration(nextCue.start);setIndex(v=>v+1);setStage('control');return}finishUtilities();return}audio.current?.pause();setReady(false);if(stage==='control'&&scene.destination&&!skip){setStage('destination');return}if(index===scenes.length-1){stop(true);return}setIndex(v=>v+1);setStage('control')}
 function start(){if(launcherTimer.current!==null){clearTimeout(launcherTimer.current);launcherTimer.current=null}setUtilityReady(false);pendingSeek.current=null;opener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setLocale(path.startsWith('/es')?'es':'en');setIndex(0);setStage('control');setPaused(false);setIssue('');setFinished(false);setActive(true)}
 // Block the actual application, including body portals; never dispatch clicks to underlying controls.
 useEffect(()=>{
  if(!active)return
  const prior=new Map<HTMLElement,boolean>()
  const isolate=()=>{for(const child of Array.from(document.body.children)){if(!(child instanceof HTMLElement)||child.hasAttribute('data-intro-root')||child.tagName==='SCRIPT'||child.tagName==='STYLE')continue;if(!prior.has(child))prior.set(child,child.inert);child.inert=true}}
  isolate();const observer=new MutationObserver(isolate);observer.observe(document.body,{childList:true})
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();stop();return}if(event.key!=='Tab')return;const buttons=Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);const first=buttons[0],last=buttons.at(-1);if(!first)return;if(event.shiftKey&&(document.activeElement===first||!dialog.current?.contains(document.activeElement))){event.preventDefault();last?.focus()}else if(!event.shiftKey&&(document.activeElement===last||!dialog.current?.contains(document.activeElement))){event.preventDefault();first.focus()}}
  document.addEventListener('keydown',key);emit('tw-intro-active',true);dialog.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
  return()=>{observer.disconnect();for(const [node,inert]of prior)if(node.isConnected)node.inert=inert;document.removeEventListener('keydown',key);emit('tw-intro-active',false);emit('tw-intro-nav',{end:true});emit('tw-intro-utilities','end');opener.current?.isConnected&&opener.current.focus()}
 // Scene changes must not release background isolation.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[active])
 useEffect(()=>{if(active&&currentRoute!==targetRoute){setReady(false);setRect(null);audio.current?.pause();router.push(targetRoute,{scroll:true})}},[active,currentRoute,targetRoute,router])
 useEffect(()=>{
  if(!active||currentRoute!==targetRoute)return
  setReady(false);setIssue('');setRect(null)
  if(closing){emit('tw-intro-utilities','show');setReady(true);return}
  emit('tw-intro-nav',{collapsed:stage==='control'&&scene.id==='N11'});emit('tw-intro-utilities',continuous?'spanish-utilities':'show')
  let highlighted:HTMLElement|null=null,expired=false,frame=0,scrolled=false
  const position=()=>{frame=0;if(expired)return
   const matches=stage==='control'?Array.from(document.querySelectorAll<HTMLElement>(`[data-tour-id="${scene.id}"]`)).filter(n=>n.getBoundingClientRect().width>0):[]
   const conditional=stage==='control'&&matches.length===0&&scene.fallback
   const node=matches.length===1?matches[0]:conditional?document.querySelector<HTMLElement>(`[data-tour-id="${scene.fallback}"]`):null
   if(stage==='destination'){if(path===home&&entrance!=='complete')return;setReady(true);setRect(null);return}
   if(!node||matches.length>1)return
   if(!scrolled){node.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});scrolled=true}
   if(highlighted!==node){highlighted?.removeAttribute('data-intro-highlight');highlighted=node;node.setAttribute('data-intro-highlight','true')}
   const b=node.getBoundingClientRect();setRect({top:b.top,left:b.left,width:b.width,height:b.height});setReady(true)
   if(!conditional)setIssue('');else setIssue(scene.id==='U05'?t('Admin is not visible for this session. No permissions are added.','Administración no está visible en esta sesión. No se añaden permisos.'):t('Favorites is not visible while signed out. The MarketHub entry is highlighted instead.','Favoritos no está visible sin iniciar sesión. Se destaca la entrada al Centro del Mercado.'))
  }
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(position)}
  const observer=new MutationObserver(schedule);observer.observe(document.getElementById('intro-tour-site')??document.body,{childList:true,subtree:true})
  window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,true);schedule()
  const timeout=window.setTimeout(()=>{if(!highlighted&&stage==='control'){expired=true;setIssue(t('The control is unavailable. Skip this scene or exit; no action was performed.','El control no está disponible. Omita esta escena o salga; no se realizó ninguna acción.'))}},15000)
  return()=>{observer.disconnect();cancelAnimationFrame(frame);clearTimeout(timeout);window.removeEventListener('resize',schedule);window.removeEventListener('scroll',schedule,true);highlighted?.removeAttribute('data-intro-highlight')}
 },[active,currentRoute,targetRoute,scene,stage,home,path,entrance,locale,closing,continuous])
 useEffect(()=>{
  const element=audio.current;if(!element)return;element.pause();setAudioBlocked(false)
  if(!active||!playbackReady||paused||!recording)return
  let current=true
  element.play().catch(()=>{if(current)setAudioBlocked(true)})
  return()=>{current=false;element.pause()}
 },[active,playbackReady,paused,recording,playbackKey])
 useEffect(()=>{const hide=()=>{if(document.hidden&&active){audio.current?.pause();setPaused(true)}};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide)},[active])
 if(!active){if(path!=='/en'&&path!=='/es')return null;return <div data-intro-root className="intro-launch" data-compact={launcherCompact}>{finished&&path!=='/es'&&<p role="status">Tour complete. Explore Twuanis.</p>}<button type="button" onClick={start} aria-label={path==='/es'?'Recorrer las funciones de Twuanis':'Tour Twuanis Features'}>{launcherCompact?<svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="6" r="4"/><circle cx="17" cy="6" r="4"/><circle cx="8" cy="6" r="1"/><circle cx="17" cy="6" r="1"/><rect x="3" y="11" width="17" height="11" rx="2"/><path d="m20 14 5-3v11l-5-3M10 22v3m-4 0h8"/></svg>:finished?(path==='/es'?'Repetir recorrido':'Replay tour'):(path==='/es'?'Recorrer las funciones de Twuanis':'Tour Twuanis Features')}</button></div>}
 return <div data-intro-root className="intro-shield" data-version={INTRO_VERSION}>
  {rect&&<div aria-hidden="true" className="intro-outline" style={{top:rect.top-5,left:rect.left-5,width:rect.width+10,height:rect.height+10}}/>}
  <div ref={dialog} className="intro-dialog" style={rect?(rect.top>window.innerHeight-rect.top-rect.height?{top:12,bottom:"auto",maxHeight:Math.max(44,rect.top-24)}:{bottom:12,top:"auto",maxHeight:Math.max(44,window.innerHeight-rect.top-rect.height-24)}):undefined} role="dialog" aria-modal="true" aria-labelledby="intro-title" aria-describedby="intro-caption">
   <p className="intro-eyebrow">{t('Discover Twuanis','Conocer Twuanis')} · {index+1}/{scenes.length}</p>
   <h2 id="intro-title">{scene.title[locale]}{stage==='destination'?t(' — Destination',' — Destino'):''}</h2>
   {!closing&&<p className="intro-preview">{recording?t('Recorded narration','Narración grabada'):t('Text preview — human recordings pending. Use Next to continue.','Vista previa con texto — grabaciones humanas pendientes. Use Siguiente para continuar.')}</p>}
   <p id="intro-caption" aria-live="polite">{caption}</p>
   {!ready&&<p role="status">{t('Waiting for the actual page/control…','Esperando la página o el control real…')}</p>}
   {issue&&<p role="status">{issue}</p>}
   <div className="intro-actions">
    <button type="button" onClick={()=>setPaused(v=>!v)}>{paused?t('Resume','Reanudar'):t('Pause','Pausar')}</button>
    <button type="button" disabled={index===0&&stage==='control'||paused} onClick={previous}>{t('Previous','Anterior')}</button>
    {directNext?<>
     {index+1!==3&&visitsDestination&&<button type="button" disabled={!ready||paused} onClick={()=>advance()}>{t('Visit destination','Visitar destino')}</button>}
     <button type="button" ref={nextButton} disabled={paused} onClick={()=>advance(true)}>{t('Next','Siguiente')}</button>
    </>:<>
     <button type="button" ref={nextButton} disabled={!ready||paused} onClick={()=>advance()}>{visitsDestination?t('Visit destination','Visitar destino'):index===scenes.length-1?t('Finish','Finalizar'):t('Next','Siguiente')}</button>
     {!hideSkip&&<button type="button" disabled={paused} onClick={()=>advance(true)}>{t('Skip scene','Omitir escena')}</button>}
    </>}
    <button type="button" onClick={replay}>{t('Replay','Repetir')}</button>
    <button type="button" aria-pressed={muted} onClick={()=>setMuted(v=>!v)}>{muted?t('Unmute','Activar audio'):t('Mute','Silenciar')}</button>
    {audioBlocked&&<button type="button" onClick={()=>audio.current?.play().then(()=>setAudioBlocked(false)).catch(()=>setAudioBlocked(true))}>{t('Play narration','Reproducir narración')}</button>}
    <button type="button" onClick={()=>stop()}>{t('Exit','Salir')}</button>
   </div>
   <audio ref={audio} src={recording||undefined} muted={muted} preload="metadata" onLoadedMetadata={()=>{if(continuous&&pendingSeek.current!==null&&audio.current){audio.current.currentTime=pendingSeek.current;pendingSeek.current=null}}} onTimeUpdate={()=>{syncUtilities();scheduleCutoff()}} onPlaying={scheduleCutoff} onPause={clearCutoff} onSeeking={clearCutoff} onSeeked={()=>{syncUtilities();scheduleCutoff()}} onRateChange={scheduleCutoff} onEnded={()=>continuous?finishUtilities():closing?stop(true):advance()} onError={()=>setIssue(t('Recording unavailable. Captions remain available; use Next.','Grabación no disponible. Los subtítulos siguen disponibles; use Siguiente.'))}/>
  </div>
 </div>
}
