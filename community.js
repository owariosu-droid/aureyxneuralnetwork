import { communityClient as client, communityConfigurationError } from './community-client.js';
import { navigate } from './navigation.js';
import { privateVault } from './private-vault.js';
import { sha256 } from './secure-backup.js';
const $=s=>document.querySelector(s),node=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e};
let user=null,selected=[],rows=[],page=0,publishing=false,loading=false;
const selectFields='id,user_id,title,artist,genre,description,storage_path,created_at';
function check(result){if(result.error)throw result.error;return result.data;}
function clearPrivate(){selected=[];$('#publish-song').replaceChildren(new Option('Unlock and load your space',''));$('#publish-title').value='';$('#publish-artist').value='';$('#publish-description').value='';$('#publish-consent').checked=false;$('#publish-status').textContent='Nothing is uploaded until you press Publish. Publishing does not register copyright.';}
window.addEventListener('nox-space-locked',clearPrivate);
function showAccount(){
 $('#account-label').textContent=user?`Signed in: ${user.email}`:'Not signed in';$('#community-signin').hidden=!!user;$('#community-signout').hidden=!user;
}
function renderFeed(){
 const list=$('#community-list');list.replaceChildren();const query=$('#community-search').value.trim().toLowerCase();
 const visible=rows.filter(r=>[r.title,r.artist,r.genre].some(v=>v.toLowerCase().includes(query)));
 if(!visible.length)list.append(node('p',query?'No loaded releases match your search.':client?'No releases yet. Be the first to share an original.':'Community is not connected yet. No public posts have been loaded.'));
 for(const row of visible){
  const card=node('article','');card.className='community-card';card.append(node('span',row.genre),node('h3',row.title),node('p',`By ${row.artist}`),node('p',row.description||''));
  const audio=document.createElement('audio');audio.controls=true;audio.preload='none';audio.src=client.storage.from('community-audio').getPublicUrl(row.storage_path).data.publicUrl;
  audio.addEventListener('play',()=>{document.querySelector('#audio').pause();for(const other of document.querySelectorAll('.community-card audio'))if(other!==audio)other.pause()});card.append(audio);
  const actions=node('div','');actions.className='vault-actions';
  const immersive=node('button','Listen with Nox visuals');immersive.className='secondary';immersive.onclick=async()=>{immersive.disabled=true;try{const response=await fetch(audio.src);if(!response.ok)throw new Error('Could not load this public audio.');const file=new File([await response.blob()],`${row.title}.audio`,{type:response.headers.get('content-type')||'audio/wav'});audio.pause();navigate('/listen');window.dispatchEvent(new CustomEvent('nox-play-original',{detail:file}))}catch(e){$('#account-status').textContent=e.message}finally{immersive.disabled=false}};actions.append(immersive);
  if(user?.id===row.user_id){const remove=node('button','Remove my public release');remove.className='secondary';remove.onclick=()=>{
    const confirm=node('div','');confirm.append(node('p','Remove this public post and audio? Your private vault stays unchanged. Copies already downloaded by others cannot be recalled.'));
    const cancel=node('button','Keep published'),yes=node('button','Remove public copy');cancel.className=yes.className='secondary';cancel.onclick=()=>confirm.remove();yes.onclick=async()=>{yes.disabled=true;try{check(await client.from('community_tracks').delete().eq('id',row.id).eq('user_id',user.id));const result=await client.storage.from('community-audio').remove([row.storage_path]);await loadFeed(true);$('#account-status').textContent=result.error?'Post removed, but audio deletion failed. Contact the site operator to remove the public file.':'Public post and audio removed.'}catch(e){$('#account-status').textContent=e.message;yes.disabled=false}};confirm.append(cancel,yes);card.append(confirm);
   };actions.append(remove)}
  if(user&&user.id!==row.user_id){const report=node('button','Report rights or safety concern');report.className='secondary';report.onclick=()=>{
    report.disabled=true;const form=document.createElement('form');form.className='report-form';const label=node('label','Describe your concern (20–1000 characters). Do not include private information.');const text=document.createElement('textarea');text.required=true;text.minLength=20;text.maxLength=1000;label.append(text);const send=node('button','Submit report'),cancel=node('button','Cancel');send.className=cancel.className='secondary';cancel.type='button';cancel.onclick=()=>{form.remove();report.disabled=false};form.append(label,send,cancel);form.onsubmit=async e=>{e.preventDefault();send.disabled=true;try{check(await client.from('community_reports').insert({track_id:row.id,reporter_id:user.id,reason:text.value.trim()}));$('#account-status').textContent='Report submitted for operator review. This does not guarantee immediate removal.';form.remove()}catch(error){$('#account-status').textContent=error.message;send.disabled=false}};card.append(form);text.focus();};actions.append(report)}
  card.append(actions);list.append(card);
 }
}
async function loadFeed(reset=false){if(!client||loading)return;loading=true;$('#refresh-community').disabled=true;try{if(reset){page=0;rows=[]}const data=check(await client.from('community_tracks').select(selectFields).order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*12,page*12+11));rows.push(...data);page++;$('#more-community').hidden=data.length<12;renderFeed();$('#community-connection').textContent='Connected · public releases are separate from private device vaults.'}catch(e){$('#community-connection').textContent=`Could not load community: ${e.message}. Your private vault is unaffected.`}finally{loading=false;$('#refresh-community').disabled=false}}
$('#refresh-community').onclick=()=>loadFeed(true);$('#more-community').onclick=()=>loadFeed();$('#community-search').oninput=renderFeed;
$('#community-signin').onsubmit=async e=>{e.preventDefault();if(!client)return;const button=e.submitter;button.disabled=true;try{check(await client.auth.signInWithOtp({email:$('#community-email').value.trim(),options:{emailRedirectTo:`${location.origin}/community`}}));$('#account-status').textContent='Check your email and open the sign-in link. The link is for this community account, not your offline vault passphrase.'}catch(error){$('#account-status').textContent=error.message}finally{button.disabled=false}};
$('#community-signout').onclick=async()=>{if(publishing){$('#account-status').textContent='Wait for publishing to finish before signing out.';return}await client.auth.signOut({scope:'local'});window.dispatchEvent(new Event('nox-force-lock'));user=null;$('#community-email').value='';clearPrivate();showAccount();renderFeed()};
$('#load-publish-songs').onclick=async()=>{try{selected=(await privateVault.operation('readonly',s=>s.getAll())).filter(w=>w.audio);$('#publish-song').replaceChildren(new Option('Select an original to publish',''));for(const w of selected)$('#publish-song').append(new Option(`${w.title||w.file} · ${w.artist}`,w.sha256));$('#publish-status').textContent=selected.length?'Choose a song and review the public credits. No upload has started.':'This space has no stored audio. Save an offline original in Protect first.'}catch(e){$('#publish-status').textContent=e.message}};
$('#publish-song').onchange=()=>{const work=selected.find(w=>w.sha256===$('#publish-song').value);$('#publish-title').value=work?.title||work?.file||'';$('#publish-artist').value=work?.artist||'';$('#publish-consent').checked=false};
$('#publish-form').onsubmit=async event=>{
 event.preventDefault();if(publishing)return;
 if(!client||!user){$('#publish-status').textContent='Connect the community and sign in before publishing.';return}
 if(!privateVault.key){$('#publish-status').textContent='Unlock your private space first.';return}
 const work=selected.find(w=>w.sha256===$('#publish-song').value);
 if(!work?.audio||!$('#publish-consent').checked){$('#publish-status').textContent='Choose stored audio and explicitly confirm permission to publish.';return}
 if(work.audio.size>50*1024*1024){$('#publish-status').textContent='Public audio must be 50 MB or smaller. Keep your master private and save a smaller listening copy.';return}
 const owner=user.id;const path=`${owner}/${crypto.randomUUID()}/${work.file.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
 let uploaded=false;publishing=true;$('#publish-submit').disabled=true;
 try{
  if(await sha256(work.audio)!==work.sha256)throw new Error('Original audio failed its fingerprint check.');
  if(user?.id!==owner||!privateVault.key)throw new Error('Session changed. Review your selection again.');
  $('#publish-status').textContent='Uploading the selected public audio copy…';
  check(await client.storage.from('community-audio').upload(path,work.audio,{contentType:work.audio.type||'audio/wav',upsert:false}));uploaded=true;
  check(await client.from('community_tracks').insert({user_id:owner,title:$('#publish-title').value.trim(),artist:$('#publish-artist').value.trim(),genre:$('#publish-genre').value,description:$('#publish-description').value.trim(),storage_path:path,sha256:work.sha256}));
  uploaded=false;$('#publish-status').textContent='Published to the community. Your private original is unchanged. You can remove the public copy from its post.';$('#publish-consent').checked=false;await loadFeed(true);
 }catch(e){let cleanup='';if(uploaded){const result=await client.storage.from('community-audio').remove([path]);if(result.error)cleanup=' The uploaded audio could not be removed; contact the operator to delete this public path: '+path;}$('#publish-status').textContent=`Publishing did not complete: ${e.message}.${cleanup}`}
 finally{publishing=false;$('#publish-submit').disabled=false}
};
if(!client){$('#community-connection').textContent=communityConfigurationError||'Community setup pending. Supabase must be connected before accounts, uploads, or public sharing work.';$('#community-signin').querySelector('button').disabled=true;$('#publish-submit').disabled=true;$('#refresh-community').disabled=true;renderFeed()}
else{client.auth.onAuthStateChange((_event,session)=>{const next=session?.user||null;if(user?.id!==next?.id){if(privateVault.key)window.dispatchEvent(new Event('nox-force-lock'));clearPrivate()}user=next;showAccount();renderFeed()});client.auth.getSession().then(({data})=>{user=data.session?.user||null;showAccount();loadFeed(true)});}
