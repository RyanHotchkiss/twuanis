export function formatListingCount(count:number,language:'en'|'es'):string {
  const grouped=new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(count)
  return language==='es'?grouped.replace(/,/g,'.'):grouped
}
