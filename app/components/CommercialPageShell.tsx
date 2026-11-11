import type {ReactNode} from 'react'
import IntelligencePackagesSurface from './IntelligencePackagesSurface'
import TopBar from './TopBar'
import './customer-commercial.css'
import '@/app/payments/customer-payment.css'

export default function CommercialPageShell({children}:{children:ReactNode}){
 return <IntelligencePackagesSurface>
  <TopBar mobileFit intelligence />
  <section className="customer-commercial customer-payment" style={{maxWidth:800,margin:'2rem auto',padding:'clamp(1rem,3vw,2rem)',border:'1px solid var(--border,#888)',borderRadius:12}}>{children}</section>
 </IntelligencePackagesSurface>
}
