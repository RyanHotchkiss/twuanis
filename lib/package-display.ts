/** Display copy only. Never apply to identifiers or stored financial records. */
export function packageDisplayLabel(value:string):string{
 if(!/\b(?:Package|Paquete)\b/i.test(value))return value
 return value.replace(/\b(Package|Paquete)\s*(?:#\s*|n[.º°\s]+)([123])\b/gi,'$1 $2').replace(/\b(or|and|o|y)\s+#([123])\b/gi,'$1 $2')
}
export function commercialDisplayNames<T extends Record<string,any>>(row:T):T{
 const result={...row};for(const key of ['nameEN','nameES','name_en','name_es'])if(typeof result[key]==='string')(result as Record<string,any>)[key]=packageDisplayLabel(result[key]);return result
}
