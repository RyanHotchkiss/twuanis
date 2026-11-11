// Isolated decoder. No URL/network input; hard process memory/time limits are enforced by caller.
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs'
const inventory=process.argv.includes("--bp-inventory-area-evidence")
let chunks=[],size=0
for await(const c of process.stdin){size+=c.length;if(size>(inventory?8388608:2097152))process.exit(2);chunks.push(c)}
try{
 const data=new Uint8Array(Buffer.concat(chunks));const task=getDocument({data,isEvalSupported:false,useWasm:false,useWorkerFetch:false,disableFontFace:true,stopAtErrors:true,enableXfa:false,verbosity:0})
 const doc=await task.promise
 if(doc.numPages<1||doc.numPages>(inventory?16:8)||await doc.getJSActions()||await doc.getAttachments())throw Error('UNSUPPORTED_PDF')
 const pages=[];let total=0
 for(let n=1;n<=doc.numPages;n++){
  const page=await doc.getPage(n);if(page.rotate!==0||page.userUnit!==1)throw Error('UNSUPPORTED_GEOMETRY')
  const v=page.getViewport({scale:1});if(v.width>2000||v.height>2000)throw Error('PAGE_LIMIT')
  if(!inventory&&(await page.getAnnotations()).length)throw Error('ANNOTATIONS_UNSUPPORTED')
  const text=await page.getTextContent({disableNormalization:true});const items=[];let omittedItems=0
  for(const t of text.items){if(!('str'in t))continue;if(++total>(inventory?50000:10000))throw Error('TEXT_LIMIT');const [a,b,c,d,x,y]=t.transform;if(b!==0||c!==0||a<=0||d<=0||t.dir!=='ltr'){if(inventory){omittedItems++;continue;}throw Error('UNSUPPORTED_TEXT')}if(!t.str.trim())continue;if(t.str.length>1024)throw Error('TEXT_LIMIT');const box=[x,v.height-y-Math.abs(t.height),x+t.width,v.height-y];if(box.some(n=>!Number.isFinite(n)||n<0)||box[2]>v.width||box[3]>v.height){if(inventory){omittedItems++;continue;}throw Error('BAD_GEOMETRY')}items.push({text:t.str,box:box.map(n=>Math.round(n*1000)/1000)})}
  pages.push({number:n,width:v.width,height:v.height,items,...(inventory?{omittedItems}:{})})
 }
 await task.destroy();process.stdout.write(JSON.stringify({pages}))
}catch{process.exitCode=2}
