const $=s=>document.querySelector(s);
const audio=$('#audio');
let preferences={volume:.8,intensity:65,motion:true};
try{const saved=JSON.parse(localStorage.getItem('nox-preferences')||'{}');if(Number.isFinite(saved.volume))preferences.volume=Math.max(0,Math.min(1,saved.volume));if(Number.isFinite(saved.intensity))preferences.intensity=Math.max(0,Math.min(100,saved.intensity));if(typeof saved.motion==='boolean')preferences.motion=saved.motion;}catch{}
export const listeningPreferences=preferences;
export function saveListeningPreference(key,value){preferences[key]=value;try{localStorage.setItem('nox-preferences',JSON.stringify(preferences))}catch{}}
audio.volume=preferences.volume;$('#volume').value=Math.round(audio.volume*100);$('#volume-value').textContent=`${Math.round(audio.volume*100)}%`;
$('#volume').oninput=event=>{audio.volume=Number(event.target.value)/100;audio.muted=false;$('#mute').textContent='◖';$('#mute').setAttribute('aria-label','Mute audio');$('#volume-value').textContent=`${event.target.value}%`;saveListeningPreference('volume',audio.volume)};
$('#loop-song').onclick=()=>{audio.loop=!audio.loop;$('#loop-song').textContent=`Loop: ${audio.loop?'on':'off'}`;$('#loop-song').setAttribute('aria-pressed',String(audio.loop))};
const guide=$('#nox-guide');$('#open-guide').onclick=()=>guide.showModal();guide.addEventListener('click',event=>{if(event.target===guide){const rect=guide.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)guide.close()}});
for(const [event,message] of [['waiting','Buffering audio…'],['seeking','Moving to your selected position…'],['ended','Finished. Play again, choose another song, or enable loop.'],['error','This audio could not be decoded. Try another supported audio format.']])audio.addEventListener(event,()=>{$('#playback-status').textContent=message});
audio.addEventListener('playing',()=>{$('#playback-status').textContent='Playing locally · the atmosphere follows your sound.'});
audio.addEventListener('pause',()=>{if(!audio.ended&&audio.getAttribute('src'))$('#playback-status').textContent='Paused · your song is still loaded.'});
window.addEventListener('nox-space-locked',()=>{$('#playback-status').textContent='Private space locked. Choose a song to begin.'});
document.addEventListener('keydown',event=>{if(event.key.toLowerCase()!=='k'||event.ctrlKey||event.altKey||event.metaKey||event.repeat||guide.open||document.body.dataset.page!=='listen')return;if(event.target.closest('input,textarea,select,button,a,[contenteditable="true"]'))return;if(!$('#play').disabled){event.preventDefault();$('#play').click()}});
