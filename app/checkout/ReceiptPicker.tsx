'use client'
import {useEffect,useRef,useState} from 'react'
import {FileText} from 'lucide-react'
export default function ReceiptPicker({file,onChange,disabled,language}:{file:File|null;onChange:(file:File|null)=>void;disabled:boolean;language:'en'|'es'}){
 const input=useRef<HTMLInputElement>(null),[preview,setPreview]=useState<string|null>(null),es=language==='es'
 useEffect(()=>{if(!file?.type.startsWith('image/')){setPreview(null);return}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url)},[file])
 return <div className="receipt-picker"><input ref={input} hidden type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required disabled={disabled} aria-label={es?'Subir comprobante de pago':'Upload Payment Receipt'} onChange={e=>onChange(e.target.files?.[0]??null)}/><button className="commercial-action" type="button" disabled={disabled} onClick={()=>{if(input.current){input.current.value='';input.current.click()}}}>{es?'Seleccionar comprobante':'Choose Receipt'}</button>{file&&<div className="receipt-selection">{preview?<img className="receipt-thumbnail" src={preview} alt={es?'Comprobante seleccionado':'Selected receipt'}/>:<span className="receipt-pdf" role="img" aria-label={es?'Documento PDF seleccionado':'Selected PDF document'}><FileText aria-hidden="true"/><span>PDF</span></span>}<span className="receipt-filename">{file.name}</span></div>}</div>
}
