/** Canonical route language; request headers never choose a language supplied by a client. */
export function documentLanguage(pathname:string,requested:string|null=null):'en'|'es'{
 if(pathname==='/es'||pathname.startsWith('/es/'))return 'es'
 if(pathname==='/remates'||pathname.startsWith('/remates/')||pathname==='/admin/remates'||pathname.startsWith('/admin/remates/'))return requested==='es'?'es':'en'
 return 'en'
}
