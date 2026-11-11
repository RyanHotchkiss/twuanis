// Browser-safe presentation vocabulary only; target and schedule authority stays in the database.
export const campaignTargets=['TWUANIS','PACKAGE','ADD_ON','OFFER','ENGINE','FEATURE'] as const
export const campaignSurfaces=['homepage','banner','popup','package','intelligence-hub','market-hub'] as const
export type CampaignSurface=typeof campaignSurfaces[number]
export type Creative={headline_en:string;headline_es:string;copy_en:string;copy_es:string;cta_en:string;cta_es:string;destination_en:string;destination_es:string;alt_en:string;alt_es:string;image:string|null;video:string|null}
export type CampaignConfiguration={name:string;creativeVersion:string;surfaces:CampaignSurface[];audience:'ALL'|'AUTHENTICATED'|'UNAUTHENTICATED';startsAt:string;endsAt:string;frequency:number;priority:number;external:Record<string,unknown>[]}
export type Campaign={id:string;targetClass:string;targetId:string;revision:string;state:string;creativeEvidence?:Creative;configuration:CampaignConfiguration}
export type CampaignItem={token:string;surface:CampaignSurface;headline:string;copy:string;cta:string;destination:string;alt:string;image:string|null;video:string|null}
export function campaignRoute(path:string):{language:'en'|'es';surfaces:CampaignSurface[]}|null {
 if(!/^\/(en|es)(\/[a-z0-9-]+)*$/.test(path))return null
 const language=path.startsWith('/es')?'es':'en'
 const scope:Record<string,CampaignSurface>={
  '/en':'homepage','/es':'homepage',
  '/en/market-hub':'market-hub','/es/centro-de-mercado':'market-hub',
  '/en/market-intelligence':'intelligence-hub','/es/inteligencia-de-mercado':'intelligence-hub',
  '/en/market-intelligence/packages':'package','/es/inteligencia-de-mercado/paquetes':'package'
 }
 return scope[path]?{language,surfaces:[scope[path],'banner','popup']}:null
}
