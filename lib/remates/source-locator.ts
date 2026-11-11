/** Evidence locator validation only; never resolves DNS or retrieves a URL. Exact bytes are retained. */
export function validateEvidenceLocator(raw:string,host:string):void{
 if(typeof raw!=='string'||raw.length>2048||/[\s\\#]/.test(raw)||!/^https:\/\/[A-Za-z0-9.-]+(?::443)?(?:\/[^\s?#]*)?(?:\?[^#]*)?$/.test(raw))throw Error('UNSAFE_SOURCE_LOCATOR')
 const u=new URL(raw);if(u.hostname!==host||u.username||u.password)throw Error('UNSAFE_SOURCE_LOCATOR')
 if(!raw.includes('?'))return
 if(u.pathname!==raw.slice(raw.indexOf('/',8),raw.indexOf('?')))throw Error('UNSAFE_QUERY_LOCATOR')
 if(!raw.startsWith('https://'+host+'/')&&!raw.startsWith('https://'+host+':443/'))throw Error('UNSAFE_QUERY_LOCATOR')
 let required:string,allowed:string[];
 if(host==='ventadebienes.bancobcr.com'&&/^\/wps\/portal\/bcrb\/bcrbienes\/bienes\/[A-Za-z]+\/detalle\/?$/.test(u.pathname)){required='codigo';allowed=['codigo','descuento','tipo_propiedad']}
 else if(host==='srv.bancopopular.fi.cr'&&u.pathname==='/Wb_BA_SharepointU/Propiedad/DetallePropiedad'){required='codBien';allowed=['codBien','codCategoria','codProvincia','page']}
 else throw Error('UNSUPPORTED_QUERY_LOCATOR')
 const keys=new Set<string>();for(const pair of raw.slice(raw.indexOf('?')+1).split('&')){const m=/^([A-Za-z_]+)=([0-9-]{1,64})$/.exec(pair);if(!m||!allowed.includes(m[1])||keys.has(m[1])||(m[1]!=='codigo'&&!/^[0-9]{1,12}$/.test(m[2])))throw Error('UNSAFE_QUERY_LOCATOR');keys.add(m[1])}
 if(!keys.has(required))throw Error('MISSING_QUERY_IDENTITY')
}
