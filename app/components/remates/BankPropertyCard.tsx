import {projectBuyBankListing} from '@/lib/remates/buy-marketplace'
import type {BankProperty} from '@/lib/remates/public-types'
import {bankPath,exactMoney} from '@/lib/remates/public-types'
import ListingDetailMeasurement from '../measurement/ListingDetailMeasurement'
export default function BankPropertyCard({item,language='en',detail=false}:{item:BankProperty;language?:'en'|'es';detail?:boolean}){const es=language==='es',presentation=projectBuyBankListing(item,language,null);return <article className="bank-card">
 {detail&&<ListingDetailMeasurement id={item.id} locale={language} market="bank"/>}
 <div className="bank-placeholder" role="img" aria-label={es?'Imagen no disponible: derechos de reproducción no establecidos':'Image unavailable: reproduction rights not established'}>⌂</div>
 <h2>{detail?presentation.title|| (es?'Propiedad bancaria':'Bank property'):<a href={`${bankPath(language)}/${item.id}`}>{presentation.title||(es?'Propiedad bancaria':'Bank property')}</a>}</h2>
 {detail&&presentation.description&&<p data-measurement-section="description">{presentation.description}</p>}
 <p>{item.institution}</p><p>{item.mechanism==='AUCTION'?(es?'Remate judicial':'Auction'):item.mechanism==='DIRECT_SALE'?(es?'Venta directa':'Direct sale'):(es?'Modalidad no confirmada':'Disposition unconfirmed')}</p>
 <p><strong>{item.amount===null?(es?'Precio no publicado':'Price not published'):`${item.currency} ${exactMoney(item.amount,language)}`}</strong></p>
 {item.amount!==null&&<p>{item.financial_kind==='AUCTION_BASE'?(es?'Base del remate':'Auction base'):(es?'Precio de venta publicado':'Published selling price')}{item.auction_round?` — ${item.auction_round}`:''}</p>}
 {detail&&item.financial_label&&<p>{item.financial_label}</p>}
 {['INSTITUTION_SUSPENDED','SOURCE_UNCONFIRMED'].includes(item.visibility_label??'')&&<p>{item.visibility_label==='INSTITUTION_SUSPENDED'?(es?'Institución suspendida — última información verificada':'Institution suspended — last verified information'):(es?'Disponibilidad no confirmada':'Availability unconfirmed')}</p>}
 {item.properties.map(p=><div key={p.id}>{p.terms.map(t=><span key={`${t.type}-${t.id}`}>{es?t.es:t.en} · </span>)}{p.area!==null&&<p>{es?'Área de terreno':'Land Area'}: {exactMoney(p.area,language)} m²</p>}{p.construction_area!=null&&<p>{es?'Área de construcción':'Construction Area'}: {exactMoney(p.construction_area,language)} m²</p>}</div>)}
 <p>{es?'Fuente':'Source'}: {item.source_name}{item.source_url&&<>{' · '}<a href={item.source_url} target="_blank" rel="noopener noreferrer">{es?'Ver publicación original':'View original publication'}</a></>}</p>
 <a href={(es?'/es/centro-de-mercado':'/en/market-hub')+'?workspace=remates&bank_property='+item.id}>{es?'Guardar en el Centro del Mercado':'Save in MarketHub'}</a>
 </article>}
