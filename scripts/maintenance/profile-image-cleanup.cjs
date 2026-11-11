'use strict';
// Explicit bounded operator job; not a page poll or automatically installed cron.
// Requires separately authorized environment credentials. No dotenv auto-loading.
const {createClient}=require('@supabase/supabase-js');
(async()=>{
 if(process.argv[2]!=='--execute')throw new Error('Usage: node scripts/maintenance/profile-image-cleanup.cjs --execute (authorized environment only)');
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error('Explicit environment required');
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const command=(op,id=null)=>db.rpc('account_profile_image_service',{p_user:null,p_request:id,p_operation:op});
 const {data,error}=await command('cleanup');if(error||!Array.isArray(data)||data.length>20)throw new Error('Cleanup reservation failed');
 let removed=0;for(const item of data){const {error}=await db.storage.from('profile-images').remove([item.path,`${item.path}.avatar-v1.webp`]);if(error)throw new Error('Storage cleanup failed; retry safely');const done=await command('cleanup_done',item.assetId);if(done.error||!done.data?.ok)throw new Error('Cleanup acknowledgement failed; retry safely');removed++}
 console.log(JSON.stringify({processed:removed,limit:20}));
})().catch(()=>{console.error('Profile image cleanup failed. No credentials or paths logged.');process.exitCode=1});
