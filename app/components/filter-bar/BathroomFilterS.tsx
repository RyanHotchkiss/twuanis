"use client"
import { bathroomHeadingToggleStyle } from '../bathroom-heading-styles'
import BathroomSelectionControl from '../BathroomSelectionControl'
import {bathroomValueLabel} from '@/lib/bathroom-selection'
type Props={selectedBathrooms:string;setSelectedBathrooms:(v:string)=>void;showBathroomOptions:boolean;setShowBathroomOptions:(v:boolean)=>void;setShowParkingOptions:(v:boolean)=>void;bathroomOptions:{en:string;es:string}[]}
export default function BathroomFilter({selectedBathrooms,setSelectedBathrooms,showBathroomOptions,setShowBathroomOptions,setShowParkingOptions}:Props){return <section><button type="button" style={bathroomHeadingToggleStyle} aria-expanded={showBathroomOptions} onClick={()=>setShowBathroomOptions(!showBathroomOptions)}>{showBathroomOptions?'−':'+'} Bathrooms</button>{showBathroomOptions?<BathroomSelectionControl language="en" value={selectedBathrooms} onChange={v=>{setSelectedBathrooms(v);if(v){setShowBathroomOptions(false);setShowParkingOptions(true)}}}/>:<p>{bathroomValueLabel(selectedBathrooms,"en")}</p>}</section>}
