import JsonLd from './JsonLd'
export default function PublicCollectionSchema({url,name,language}:{url:string;name:string;language:'en'|'es'}){
 return <JsonLd data={{'@context':'https://schema.org','@type':'CollectionPage',url:'https://twuanis.com'+url,name,inLanguage:language}}/>
}
