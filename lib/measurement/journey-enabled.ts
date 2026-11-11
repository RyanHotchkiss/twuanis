import 'server-only'
export function journeyCollectionEnabled(){
 if(process.env.TWUANIS_MEASUREMENT_JOURNEY_ENABLED!=='1')return false
 try{const url=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL||'');if(process.env.TWUANIS_MEASUREMENT_LOCAL==='1'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname))return true
 return process.env.VERCEL_ENV==='production'&&url.href==='https://szhpqemhjyvvqgjgsmsw.supabase.co/'&&process.env.TWUANIS_MEASUREMENT_ENABLED==='1'&&process.env.TWUANIS_MEASUREMENT_PRIVACY_APPROVED==='1'
 }catch{return false}
}

// Privacy cleanup remains operable after collection containment; same verified targets.
export function journeyMaintenanceEnabled(){
 if(journeyCollectionEnabled())return true
 if(process.env.TWUANIS_MEASUREMENT_JOURNEY_MAINTENANCE_ENABLED!=='1')return false
 try{const url=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL||'');return process.env.TWUANIS_MEASUREMENT_LOCAL==='1'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)||process.env.VERCEL_ENV==='production'&&url.href==='https://szhpqemhjyvvqgjgsmsw.supabase.co/'}catch{return false}
}
