import {readBankProperty} from '@/app/actions/remates-public'
import {bankPath} from '@/lib/remates/public-types'
import BankPropertyCard from './BankPropertyCard'
import './bank-marketplace.css'
export default async function BankDetail({id,language}:{id:string;language:'en'|'es'}){const r=await readBankProperty(id),es=language==='es';return <main lang={language} className="bank-marketplace"><a href={bankPath(language)}>{es?'Volver a Remates':'Back to Bank Properties'}</a><h1>{es?'Propiedad bancaria':'Bank property'}</h1>{!r.ok?<p role="alert">{es?'No se pudo cargar la propiedad.':'Property could not be loaded.'}</p>:!r.data.enabled||!r.data.items[0]?<p>{es?'Propiedad no disponible.':'Property unavailable.'}</p>:<BankPropertyCard item={r.data.items[0]} language={language} detail/>}</main>}
