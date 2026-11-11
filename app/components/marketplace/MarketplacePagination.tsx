'use client'
import {marketplacePageNumbers,marketplacePageSizes} from '@/lib/marketplace-pagination'
export default function MarketplacePagination({page,pageSize,total,language,onPage,onSize,loading=false}:{page:number;pageSize:number;total:number;language:'en'|'es';onPage:(p:number)=>void;onSize:(n:number)=>void;loading?:boolean}){
 const es=language==='es',last=Math.max(1,Math.ceil(total/pageSize));const style={border:'1px solid var(--border)',background:'var(--surface)',color:'var(--foreground)',borderRadius:999,padding:'10px 14px',cursor:'pointer'}
 return <nav aria-label={es?'Paginación de propiedades':'Listing pagination'} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,flexWrap:'wrap',marginTop:24}}>
 <label>{es?'Propiedades por página':'Listings per page'} <select aria-label={es?'Propiedades por página':'Listings per page'} value={pageSize} onChange={e=>onSize(Number(e.target.value))} style={style}>{marketplacePageSizes.map(n=><option key={n} value={n}>{n}</option>)}</select></label>
 {total>0&&<>
 <button style={style} disabled={loading||page<=1} onClick={()=>onPage(page-1)}>‹ {es?'Anterior':'Previous'}</button>
 {marketplacePageNumbers(page,total,pageSize).map(n=><button key={n} style={{...style,borderColor:n===page?'#ff3b00':'var(--border)',color:n===page?'#ff3b00':'var(--foreground)'}} aria-label={(es?'Página ':'Page ')+n} aria-current={n===page?'page':undefined} disabled={loading} onClick={()=>onPage(n)}>{n}</button>)}
 <button style={style} disabled={loading||page>=last} onClick={()=>onPage(page+1)}>{es?'Siguiente':'Next'} ›</button>
 </>}
 </nav>
}
