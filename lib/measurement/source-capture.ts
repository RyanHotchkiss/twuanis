import 'server-only'
export function sourceCaptureEnabled(){
 try{return process.env.TWUANIS_KA10_SOURCE_CAPTURE_LOCAL==='1'&&['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL||'').hostname)||process.env.TWUANIS_KA10_SOURCE_CAPTURE_ENABLED==='1'&&process.env.TWUANIS_MEASUREMENT_PRIVACY_APPROVED==='1'&&process.env.NEXT_PUBLIC_SUPABASE_URL==='https://szhpqemhjyvvqgjgsmsw.supabase.co'}catch{return false}
}
