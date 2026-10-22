import { createClient } from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export let communityClient=null;
export let communityConfigurationError='';
if(url&&key){
 try{
  if(new URL(url).protocol!=='https:'&& !url.startsWith('http://localhost:'))throw new Error('Use an HTTPS Supabase URL.');
  if(key.startsWith('sb_secret_'))throw new Error('A server secret cannot be used in public frontend configuration.');
  if(key.split('.').length===3){try{const payload=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(payload.role==='service_role')throw new Error('Service-role keys must never be used in the browser.');}catch(e){if(e.message.includes('Service-role'))throw e;}}
  communityClient=createClient(url,key,{auth:{persistSession:false,detectSessionInUrl:true,flowType:'implicit'}});
 }catch{communityConfigurationError='Community configuration is invalid. The operator must supply the project URL and public publishable key; never a server secret.';}
}
