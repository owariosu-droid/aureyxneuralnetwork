// Run ONLY against a dedicated test project with two distinct test accounts.
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY,aToken=process.env.NOX_TEST_A_TOKEN,bToken=process.env.NOX_TEST_B_TOKEN;
if(!url||!key||!aToken||!bToken)throw new Error('Set the project URL, public publishable key, and two test-user access tokens in a local environment file. Never commit tokens.');
const options={auth:{persistSession:false,autoRefreshToken:false}};
const client=token=>createClient(url,key,{...options,global:{headers:{Authorization:`Bearer ${token}`}}});
const a=client(aToken),b=client(bToken),anon=createClient(url,key,options);
const check=result=>{if(result.error)throw new Error(result.error.message);return result.data};
const userA=check(await a.auth.getUser(aToken)).user,userB=check(await b.auth.getUser(bToken)).user;
assert.notEqual(userA.id,userB.id);
const id=crypto.randomUUID(),path=`${userA.id}/${id}/test.wav`;
try{
 const audio=new Blob(['test policy bytes'],{type:'audio/wav'});
 check(await a.storage.from('community-audio').upload(path,audio,{contentType:'audio/wav'}));
 check(await a.from('community_tracks').insert({user_id:userA.id,title:'Access policy test',artist:'Test account A',genre:'Other',description:'Temporary policy validation',storage_path:path,sha256:'a'.repeat(64)}));
 const row=check(await a.from('community_tracks').select('id').eq('storage_path',path).single());
 const spoof=await b.from('community_tracks').insert({user_id:userA.id,title:'Must fail',artist:'B',genre:'Other',storage_path:`${userA.id}/${crypto.randomUUID()}/spoof.wav`,sha256:'a'.repeat(64)});assert.ok(spoof.error,'B must not publish as A');
 const visitor=await anon.from('community_tracks').insert({user_id:userA.id,title:'Must fail',artist:'Anonymous',genre:'Other',storage_path:`${userA.id}/${crypto.randomUUID()}/anon.wav`,sha256:'a'.repeat(64)});assert.ok(visitor.error,'Anonymous publishing must fail');
 await b.from('community_tracks').delete().eq('id',row.id);
 assert.equal(check(await a.from('community_tracks').select('id').eq('id',row.id)).length,1,'B must not remove A’s post');
 await b.storage.from('community-audio').remove([path]);
 assert.equal((check(await a.storage.from('community-audio').download(path))).size,audio.size,'B must not remove A’s audio');
 const wrongFolder=await b.storage.from('community-audio').upload(`${userA.id}/${crypto.randomUUID()}/bad.wav`,audio,{contentType:'audio/wav'});assert.ok(wrongFolder.error,'B must not upload into A’s folder');
 assert.equal(check(await anon.from('community_tracks').select('id').eq('id',row.id)).length,1,'Explicitly published releases should be public');
 console.log('PASS: two-account publishing/deletion/storage ownership and anonymous read/write rules.');
}finally{
 await a.from('community_tracks').delete().eq('storage_path',path);
 await a.storage.from('community-audio').remove([path]);
}
