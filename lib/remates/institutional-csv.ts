// Pure bounded CSV projection. No remote retrieval, spreadsheet execution or publication.
export const institutionalColumns=['key','expected','title','parcel','jurisdiction','province','canton','district','property_type','mechanism','amount','currency','round'] as const
export type InstitutionalRow=Record<typeof institutionalColumns[number],string|null>&{key:string;expected:string;title:string;parcel:string;jurisdiction:string;mechanism:string}
export function parseInstitutionalCsv(raw:string):InstitutionalRow[]{
 if(typeof raw!=='string'||new TextEncoder().encode(raw).length>32768||raw.includes('\0'))throw Error('INVALID_CSV')
 const rows:string[][]=[];let row:string[]=[],field='',quoted=false,closed=false;const text=raw.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++}else{quoted=false;closed=true}}else field+=c;if(field.length>2048)throw Error('INVALID_CSV');continue}if(closed&&c!==','&&c!=='\n'&&c!=='\r')throw Error('INVALID_CSV');if(c==='"'){if(field||closed)throw Error('INVALID_CSV');quoted=true}else if(c===','){row.push(field);field='';closed=false}else if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field='';closed=false}else field+=c;if(rows.length>26||row.length>13||field.length>2048)throw Error('INVALID_CSV')}
 if(quoted)throw Error('INVALID_CSV');if(field||row.length||closed){row.push(field);rows.push(row)}
 if(rows.length<2||rows.length>26||rows[0].join(',')!==institutionalColumns.join(',')||rows.slice(1).some(x=>x.length!==13))throw Error('INVALID_CSV')
 return rows.slice(1).map(cells=>Object.fromEntries(institutionalColumns.map((k,i)=>[k,cells[i]===''&&!['key','expected','title','parcel','jurisdiction','mechanism'].includes(k)?null:cells[i]])) as InstitutionalRow)
}
