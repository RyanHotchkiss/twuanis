// Presentation-only: call for analytical labels/prose, never canonical IDs or stored evidence.
export function analyticalTerminology(text:string):string {
 return text.replace(/\b(engines?|motor(?:es)?)\b/gi,(word:string,_match:string,offset:number)=>{
  if(/search[- ]$/i.test(text.slice(0,offset))||/^\s+de\s+b[úu]squeda/i.test(text.slice(offset+word.length)))return word
  const next=/^engine/i.test(word)?(/s$/i.test(word)?'algorithms':'algorithm'):(/es$/i.test(word)?'algoritmos':'algoritmo')
  return word===word.toUpperCase()?next.toUpperCase():/^[A-Z]/.test(word)?next[0].toUpperCase()+next.slice(1):next
 })
}
