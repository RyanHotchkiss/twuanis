'use client'
import {useSiteTheme} from './theme/ThemeProvider'
export default function PaymentBrandMark(){const{theme}=useSiteTheme();return <img className="payment-brand-mark" src={theme==='light'?'/images/black-20S-logo.svg':'/images/white-20s-logo.svg'} alt="Twuanis 20S" width={44} height={44}/>}
