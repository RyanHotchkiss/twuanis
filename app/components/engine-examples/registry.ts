// Finite public releases approved by the Owner; no engine execution or protected lookup.
export const exampleReleases = {
 'weighted-price':{capability:'cap-weighted-price-m2',engineId:'weighted-price',file:'weighted-price-v1.json',sha256:'362cc970a21d56a9c9d01d7b1e8053eb66706cde3d37afb258fb204830944802',version:'v1',approval:'call_749460ea2ba94f7bb654013f88b90ef4:0'},
 explorer:{capability:'cap-market-summary',engineId:'summary',file:'summary-v1.json',sha256:'56775b2fd63ea49b61509c232e033d7c5a05625a29882ba42fbf8b99eb0938e0',version:'v1',approval:'call_7218f82769ed4a8bb5c2738d5e3867a1:0'},
 comparison:{capability:'cap-market-comparison',engineId:'comparison',file:'comparison-v2.json',sha256:'86daa2566763128c1a755c83fca5d45fe416a41aa70acb1d161fde16bc1542a3',version:'v2',approval:'call_7218f82769ed4a8bb5c2738d5e3867a1:1'},
 comparables:{capability:'cap-user-defined-comparable-cohort',engineId:'comparables',file:'comparables-v1.json',sha256:'8225b1736505601653178c97d69866403c17468997282651feeae93f035bd439',version:'v1',approval:'call_7218f82769ed4a8bb5c2738d5e3867a1:2'}
,
 "composition":{capability:'cap-market-composition',"engineId":"composition","file":"composition-v1.json","sha256":"31a29d609d7c7606443555927ec86ce3cef3b97c46dbee1f8d3e26fc1dfca50f","version":"v1","approval":"call_7cb54d44eaf248f6a94cd831a808272c:0"},
 "asking-price":{capability:'cap-market-asking-price-distribution',"engineId":"market-asking-price-distribution","file":"market-asking-price-distribution-v1.json","sha256":"f41e5dde2646e6951be7c87cc221fccb33725dd611280fba9903c9c821205521","version":"v1","approval":"call_7cb54d44eaf248f6a94cd831a808272c:0"},
 "matching":{capability:'cap-property-matching',"engineId":"matching","file":"matching-v1.json","sha256":"d1230bc7b03ae33fb01dcb2120d40918304a5deddbe6d54461365ba607fd26ad","version":"v1","approval":"call_7cb54d44eaf248f6a94cd831a808272c:0"},
 "scarcity":{capability:'cap-property-configuration-frequency',"engineId":"configuration","file":"configuration-v1.json","sha256":"82f89624fe419358d6cc13a56eb15d57e67ac95bf3bc5138dc65f4f13c893798","version":"v1","approval":"call_7cb54d44eaf248f6a94cd831a808272c:0"},
 "price-meter":{capability:'cap-price-m2-distribution',"engineId":"distribution","file":"distribution-v1.json","sha256":"d20f368d5c051b9e596b9348591d31989e6b36d697befe8e599b051cc0ace62d","version":"v1","approval":"call_7cb54d44eaf248f6a94cd831a808272c:0"},
 "geography":{capability:'cap-geographic-price-m2-comparison',"engineId":"geography","file":"geography-v1.json","sha256":"b53bae68d7703bc6769f0b5f49fbba70a12187c176bba9fbb8d760ee7f3e6520","version":"v1","approval":"call_7cb54d44eaf248f6a94cd831a808272c:0"},
 "size":{capability:'cap-size-price-m2',"engineId":"size","file":"size-v1.json","sha256":"6868641a830277ea5c1508faee1f6768f18a813f08ecf2b332155717f9bdce3d","version":"v1","approval":"call_7cb54d44eaf248f6a94cd831a808272c:0"},
 "construction-land":{capability:'cap-construction-land-price-m2',"engineId":"construction-land","file":"construction-land-v1.json","sha256":"376030c66fadf8cdc9e6e60d55ecd77fca50fc223be1e1163c0a669b4701c736","version":"v1","approval":"call_7cb54d44eaf248f6a94cd831a808272c:0"},
 "cohort-comparison":{capability:'cap-user-defined-cohort-price-m2-comparison',"engineId":"cohort-comparison","file":"cohort-comparison-v1.json","sha256":"49ac28992de477ceaeadcec506ddbd3da20fc0f0b60803d2b8ca38bb2d3be5f7","version":"v1","approval":"call_7cb54d44eaf248f6a94cd831a808272c:0"},
 "cross-dimensional":{capability:'cap-cross-dimensional-analysis',"engineId":"cross-dimensional","file":"cross-dimensional-v1.json","sha256":"3224a2f668216e46ae9e9a11e991ad706e83ec7e6f9b6418a1dcbc965c387171","version":"v1","approval":"call_7cb54d44eaf248f6a94cd831a808272c:0"},
 "discovery":{capability:'cap-comparative-price-m2-discovery',"engineId":"discovery","file":"discovery-v1.json","sha256":"1abcbbfa966206a8f02ad98d77ce8de8ccf5bf3cd41183cce4db3aeb40372d50","version":"v1","approval":"call_7cb54d44eaf248f6a94cd831a808272c:0"},
 "position":{capability:'cap-property-price-m2-position',"engineId":"position","file":"position-v1.json","sha256":"29c9b5f4a24974fcf444aacefa1a85e38ba5980d4ee4e716f574955e1e23c3a6","version":"v1","approval":"call_7cb54d44eaf248f6a94cd831a808272c:0"},
 "asking-area-ratio":{capability:'cap-asking-area-coefficient-ratio',"engineId":"asking-area-ratio","file":"asking-area-ratio-v1.json","sha256":"4553a65876b2df13ce02f609e4ce69d786ab58f39776b5495c2e7dd2f94180b5","version":"v1","approval":"call_7cb54d44eaf248f6a94cd831a808272c:0"}
} as const
export type ExampleEngine=keyof typeof exampleReleases
export function exampleRelease(engine:string){return Object.hasOwn(exampleReleases,engine)?exampleReleases[engine as ExampleEngine]:undefined}
export type PublicExample={schemaVersion:1;engineId:string;exampleId:string;executedAt:string;analyticalDate:string|null;artifactVersion:string;body:unknown;input:unknown;labels?:{en:string[];es:string[]};disclosures:{en:string[];es:string[]}}
export async function loadExample(engine:string,signal:AbortSignal):Promise<PublicExample>{
 const release=exampleRelease(engine);if(!release)throw Error('unavailable')
 const response=await fetch(`/engine-examples/${release.file}`,{signal,credentials:'omit'});if(!response.ok)throw Error('unavailable')
 const bytes=await response.arrayBuffer();const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==release.sha256)throw Error('integrity')
 // Exact-byte digest pins the full, reviewed finite DTO, including every result field.
 const value=JSON.parse(new TextDecoder().decode(bytes)) as PublicExample
 if(value.schemaVersion!==1||value.engineId!==release.engineId||value.artifactVersion!==release.version)throw Error('identity')
 return value
}

// Presentation link only: capability identity resolves through this existing example registry.
export function exampleEngineForCapability(capability:string){return Object.entries(exampleReleases).find(([,release])=>release.capability===capability)?.[0]}
