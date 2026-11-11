'use client'

import {useEffect, useId, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import overlay from '../engine-examples/examples.module.css'
import styles from './methodology.module.css'

const copy = {
  en: {
    title: 'How Twuanis Values Real Estate',
    paragraphs: [
      "Twuanis algorithms analyze Costa Rica's real estate market using current property asking prices.",
      'Asking prices are observable market evidence. They establish what sellers are currently requesting for properties offered in a defined market.',
      'Twuanis collects this evidence, identifies properties within user-defined market populations, and applies statistical algorithms to calculate price distributions, relationships, differences, and individual property positions.',
      'Registered transaction amounts do not necessarily represent the full economic consideration exchanged between buyers and sellers. Reporting practices, noncash consideration, concessions, and other factors can create discrepancies between recorded and actual prices.',
      'Twuanis deliberately excludes transaction-price data from its analytical methodology because of these reliability concerns.',
    ],
    question: 'Why not transaction prices?',
    final: 'Twuanis real estate valuations are derived from observable market asking prices and statistically defined property populations.',
    trigger: 'How Twuanis values real estate',
    close: 'Close methodology',
  },
  es: {
    title: 'Cómo Valora Twuanis los Bienes Inmuebles',
    paragraphs: [
      'Los algoritmos de Twuanis analizan el mercado inmobiliario de Costa Rica utilizando los precios de oferta actuales de las propiedades.',
      'Los precios de oferta constituyen evidencia observable del mercado. Establecen los precios que los vendedores solicitan actualmente por las propiedades ofrecidas dentro de un mercado definido.',
      'Twuanis recopila esta evidencia, identifica las propiedades que pertenecen a poblaciones de mercado definidas por el usuario y aplica algoritmos estadísticos para calcular distribuciones de precios, relaciones, diferencias y posiciones individuales de las propiedades.',
      'Los montos registrados en las transacciones no necesariamente representan la totalidad de la contraprestación económica intercambiada entre compradores y vendedores. Las prácticas de declaración, las contraprestaciones no monetarias, las concesiones y otros factores pueden generar discrepancias entre los precios registrados y los importes reales.',
      'Twuanis excluye deliberadamente los datos de precios de transacción de su metodología analítica debido a estas consideraciones sobre su fiabilidad.',
    ],
    question: '¿Por qué no utilizar los precios de transacción?',
    final: 'Las valoraciones inmobiliarias de Twuanis se derivan de los precios de oferta observables del mercado y de poblaciones de propiedades definidas estadísticamente.',
    trigger: 'Cómo valora Twuanis los bienes inmuebles',
    close: 'Cerrar metodología',
  },
} as const

export default function ValuationMethodology({language}:{language:'en'|'es'}) {
  const [open,setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null), dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId(), text = copy[language]
  useEffect(() => {
    if (!open) return
    const element = dialog.current, previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element?.showModal()
    return () => {
      element?.close()
      document.body.style.overflow = previous
      queueMicrotask(() => {
      if (trigger.current?.getClientRects().length && !trigger.current.closest('[aria-hidden="true"]')) trigger.current.focus({preventScroll:true})
      else {
        const heading = document.querySelector<HTMLElement>('[data-home-engines] h2')
        if (heading) {
          const previousTabIndex = heading.getAttribute('tabindex')
          heading.setAttribute('tabindex','-1')
          heading.focus({preventScroll:true})
          heading.addEventListener('blur', () => {
            if (previousTabIndex === null) heading.removeAttribute('tabindex')
            else heading.setAttribute('tabindex',previousTabIndex)
          }, {once:true})
        }
      }
      })
    }
  },[open])
  return <>
    <button ref={trigger} type="button" className={styles.trigger} aria-label={text.trigger} aria-haspopup="dialog" aria-expanded={open}
      onPointerEnter={event => {if(event.pointerType==='mouse')setOpen(true)}} onClick={()=>setOpen(true)}>
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor"/><path d="M7.8 7.1a2.3 2.3 0 0 1 4.5.6c0 1.5-2.3 1.7-2.3 3.3" fill="none" stroke="currentColor" strokeLinecap="round"/><circle cx="10" cy="14" r=".8" fill="currentColor"/></svg>
    </button>
    {open && createPortal(<dialog ref={dialog} className={`${overlay.dialog} ${styles.dialog}`} aria-labelledby={titleId}
      onCancel={event=>{event.preventDefault();setOpen(false)}}>
      <header className={overlay.header}><h2 id={titleId}>{text.title}</h2><button type="button" autoFocus aria-label={text.close} onClick={()=>setOpen(false)}>×</button></header>
      <div className={`${overlay.body} ${styles.body}`} tabIndex={0}>
        {text.paragraphs.slice(0,3).map(paragraph=><p key={paragraph}>{paragraph}</p>)}
        <h3>{text.question}</h3>
        {text.paragraphs.slice(3).map(paragraph=><p key={paragraph}>{paragraph}</p>)}
        <p><em>{text.final}</em></p>
      </div>
    </dialog>,document.body)}
  </>
}
