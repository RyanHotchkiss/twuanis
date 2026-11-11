// Existing focused Step3 checks run after the new Step5 canonical primitive extraction.
const fs=require('fs'),path=require('path'),Module=require('module');
const file=path.join(__dirname,'commercial-administrative-step3.cjs');
const anchor=" sql(file('supabase/migrations/029_administrative_media.sql'));";
let source=fs.readFileSync(file,'utf8');if(source.split(anchor).length!==2)throw Error('Existing verifier checkpoint changed');
source=source.replace(anchor,anchor+"\n for(const name of ['030_intelligence_package_configurations.sql','031_addon_catalog.sql','032_addon_customer_bulk_import.sql','033_addon_fulfillment_placement.sql'])sql(file('supabase/migrations/'+name));");
const m=new Module(file,module);m.filename=file;m.paths=module.paths;m._compile(source,file);
