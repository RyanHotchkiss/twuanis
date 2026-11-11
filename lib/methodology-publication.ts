/** Publication is closed until verified public bindings and Owner release approval exist. */
export function localMethodologyPreviewEnabled(){
 return process.env.NODE_ENV!=='production' && process.env.TWUANIS_KA03_PREVIEW==='1'
}
