import {createCyberneticPalette,createHoverCue} from './cybernetic-sounds.js';
import {installHoverSounds} from './hover-sounds.js';
import {deriveSoundPalette,packPalette,unpackPalette} from './sound-design.js';
const $=s=>document.querySelector(s),dialog=$('#sound-dialog'),status=$('#sound-status');
const PALETTE_KEY='nox-interface-palette',STYLE_KEY='nox-interface-style';
let context,master,palette=null,enabled=false,volume=.15,lastCue=-Infinity,generation=0,building=false,restored=false,paletteKind='cybernetic',hoverEnabled=true,lastCueKind='';
let diagnostics={played:0,lastCue:null,ducked:false};const voices=new Set();
try{hoverEnabled=localStorage.getItem('nox-interface-hover')!=='false';const saved=Number(localStorage.getItem('nox-interface-volume'));if(localStorage.getItem('nox-interface-volume')!==null&&Number.isFinite(saved))volume=Math.max(0,Math.min(.4,saved))}catch{}
async function ensureContext(){
 if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('This browser does not support interface audio.');try{context=new Audio({sampleRate:22050,latencyHint:'interactive'})}catch{context=new Audio()}master=context.createGain();master.gain.value=0;master.connect(context.destination)}
 if(context.state!=='running')await context.resume();return context;
}
function stopVoices(){cancelHover();for(const voice of voices){try{voice.stop()}catch{}}voices.clear();if(master&&context)master.gain.setTargetAtTime(0,context.currentTime,.015)}
function update(){
 $('#ui-sound-toggle').textContent=`UI sounds: ${enabled?'on':'off'}`;$('#ui-sound-toggle').setAttribute('aria-pressed',String(enabled));
 $('#ui-sound-volume').value=Math.round(volume*100);$('#ui-sound-volume-value').textContent=`${Math.round(volume*100)}%`;
 for(const button of document.querySelectorAll('[data-preview-sound]'))button.disabled=!palette;
 $('#export-sound-palette').disabled=!palette;
 $('#hover-sounds-enabled').checked=hoverEnabled;
 $('#sound-palette-name').textContent=palette?`${paletteKind==='cybernetic'?'Cybernetic':'Custom source'} palette · ${enabled?'enabled':'off'}`:'Built-in cybernetic palette ready to enable';
}
async function cue(kind,preview=false){
 if((!enabled&&!preview)||!palette||document.hidden||volume===0)return;
 if(kind==='hover'&&!preview&&context?.state!=='running')return;
 const now=performance.now();if(kind!=='confirm'&&lastCueKind!=='hover'&&now-lastCue<85)return;if(kind==='hover'&&voices.size>=2)return;if(voices.size>=3){const oldest=voices.values().next().value;try{oldest.stop()}catch{}voices.delete(oldest)}lastCue=now;lastCueKind=kind;
 const epoch=generation;
 try{await ensureContext();if(epoch!==generation||(!enabled&&!preview)||!palette)return;
  if(voices.size>=3){if(kind==='hover')return;const oldest=voices.values().next().value;try{oldest.stop()}catch{}voices.delete(oldest)}
  const music=$('#audio'),publicAudio=[...document.querySelectorAll('.community-card audio')].some(a=>!a.paused&&!a.ended&&!a.muted);
  const ducked=(!music.paused&&!music.ended&&!music.muted&&music.volume>0)||publicAudio;
  master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(volume*(ducked?.22:1),context.currentTime,.018);
  const source=context.createBufferSource(),level=context.createGain();source.buffer=palette[kind]||palette.click;level.gain.value=kind==='hover'?.32:1;source.connect(level);level.connect(master);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();level.disconnect()};source.start();diagnostics={played:diagnostics.played+1,lastCue:kind,ducked};
 }catch{enabled=false;stopVoices();update();status.textContent='Audio could not start. Tap UI sounds again or try another browser.'}
}
async function sourceDuration(file){
 const probe=document.createElement('audio'),url=URL.createObjectURL(file);
 try{return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Could not read this audio. Try a shorter WAV or MP3 excerpt.')),12000);probe.onloadedmetadata=()=>{clearTimeout(timer);if(!Number.isFinite(probe.duration)||probe.duration<=0)reject(new Error('Could not determine the audio duration. Try a WAV or MP3 excerpt.'));else resolve(probe.duration)};probe.onerror=()=>{clearTimeout(timer);reject(new Error('This audio format could not be read by the browser.'))};probe.preload='metadata';probe.src=url;});}
 finally{probe.removeAttribute('src');probe.load();URL.revokeObjectURL(url)}
}
async function remember(){
 try{localStorage.setItem(STYLE_KEY,paletteKind);if(paletteKind==='cybernetic')return;if($('#remember-sound-palette').checked&&palette)localStorage.setItem(PALETTE_KEY,JSON.stringify(packPalette(palette)));else localStorage.removeItem(PALETTE_KEY)}catch{status.textContent+=' The browser could not remember this palette; it works for this tab only.'}
}
function accept(next,message,kind='custom'){palette=withHover(next);paletteKind=kind;restored=false;enabled=true;generation++;stopVoices();update();status.textContent=message;void remember();void cue('confirm',true)}
$('#ui-sound-settings').onclick=()=>dialog.showModal();
function withHover(next){return {...next,hover:next.hover||createHoverCue(next.click,context)}}
$('#use-cybernetic-sounds').onclick=async()=>{const epoch=++generation;try{await ensureContext();if(epoch!==generation)return;accept(createCyberneticPalette(context),'Cybernetic sounds enabled: quiet hover pings, digital presses, and airy navigation.','cybernetic')}catch(error){status.textContent=error.message}};
$('#ui-sound-toggle').onclick=async()=>{
 const epoch=++generation;if(enabled){enabled=false;stopVoices();update();return}
 try{
  await ensureContext();if(epoch!==generation)return;
  if(!palette){
   try{const saved=localStorage.getItem(PALETTE_KEY);if(saved&&localStorage.getItem(STYLE_KEY)!=='cybernetic'){palette=withHover(unpackPalette(JSON.parse(saved),context));paletteKind='custom';restored=true;$('#remember-sound-palette').checked=true}}
   catch{status.textContent='The remembered custom palette could not be read. Using cybernetic sounds instead.'}
   if(!palette){palette=createCyberneticPalette(context);paletteKind='cybernetic';restored=false}
  }
  enabled=true;update();status.textContent=paletteKind==='cybernetic'?'Cybernetic interface sounds are on. Hover softly; press for a digital response.':restored?'Remembered custom sounds are on, with a source-derived hover cue.':'Your custom sound palette is on.';await cue('toggle',true);
 }catch(error){status.textContent=error.message;enabled=false;update()}
};
$('#create-sound-palette').onclick=async()=>{
 if(building)return;const file=$('#sound-source').files[0];if(!file){status.textContent='Choose NEODR3AD or another audio file first.';return}
 if(!file.size||file.size>128*1024*1024){status.textContent='Choose a non-empty audio file under 128 MB. A shorter excerpt works too.';return}
 building=true;const epoch=++generation;$('#create-sound-palette').disabled=true;
 try{status.textContent='Decoding locally and shaping four short sounds…';await ensureContext();if(await sourceDuration(file)>600)throw new Error('Choose a source under 10 minutes long to keep processing manageable.');if(epoch!==generation)return;const buffer=await context.decodeAudioData(await file.arrayBuffer());if(buffer.duration>600)throw new Error('Choose a source under 10 minutes long to keep processing manageable.');const next=await deriveSoundPalette(buffer,context);if(epoch!==generation)return;$('#sound-source').value='';accept(next,'Your source-derived palette is ready: soft clicks, airy navigation, toggles, and save confirmations. No source audio was uploaded.');}
 catch(error){if(epoch===generation)status.textContent=`Could not create sounds: ${error.message}`}
 finally{building=false;$('#create-sound-palette').disabled=false}
};
$('#ui-sound-volume').oninput=event=>{volume=Number(event.target.value)/100;if(context&&master){const music=$('#audio'),ducked=(!music.paused&&!music.ended&&!music.muted&&music.volume>0)||[...document.querySelectorAll('.community-card audio')].some(a=>!a.paused&&!a.ended&&!a.muted);master.gain.setTargetAtTime(volume*(ducked?.22:1),context.currentTime,.03);}if(volume===0)stopVoices();try{localStorage.setItem('nox-interface-volume',String(volume))}catch{}update()};
$('#remember-sound-palette').onchange=()=>remember();
$('#hover-sounds-enabled').onchange=event=>{hoverEnabled=event.target.checked;if(!hoverEnabled)cancelHover();try{localStorage.setItem('nox-interface-hover',String(hoverEnabled))}catch{}};
for(const button of document.querySelectorAll('[data-preview-sound]'))button.onclick=()=>cue(button.dataset.previewSound,true);
$('#export-sound-palette').onclick=()=>{if(!palette)return;const blob=new Blob([JSON.stringify(packPalette(palette))],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='nox-interface-sounds.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000)};
$('#import-sound-palette').onchange=async event=>{const file=event.target.files[0];if(!file)return;const epoch=++generation;try{if(file.size>700000)throw new Error('Choose a small exported sound palette under 700 KB.');await ensureContext();const next=unpackPalette(JSON.parse(await file.text()),context);if(epoch===generation)accept(next,'Sound palette imported and enabled.')}catch(error){status.textContent=`Could not import: ${error.message}`}finally{event.target.value=''}};
$('#forget-sound-palette').onclick=()=>{generation++;enabled=false;palette=null;restored=false;stopVoices();$('#sound-source').value='';$('#remember-sound-palette').checked=false;try{localStorage.removeItem(PALETTE_KEY);localStorage.setItem(STYLE_KEY,'cybernetic');status.textContent='Custom palette cleared. Sounds are off; cybernetic sounds are still available when you enable them.'}catch{status.textContent='Sounds are off, but browser storage could not be cleared. Remove site data to forget the remembered palette.'}update()};
document.addEventListener('click',event=>{
 if(!event.isTrusted||!enabled||event.ctrlKey||event.metaKey||event.altKey)return;
 const target=event.target.closest('button,a[href],summary,input[type="checkbox"]');if(!target||target.disabled||target.closest('#sound-dialog')||['ui-sound-toggle','ui-sound-settings'].includes(target.id))return;
 void cue(target.matches('a[data-route]')?'navigate':target.matches('summary,input[type="checkbox"],[aria-pressed]')?'toggle':'click');
},true);
window.addEventListener('nox-save-verified',()=>cue('confirm'));
document.addEventListener('visibilitychange',()=>{if(document.hidden){generation++;stopVoices()}});
window.addEventListener('pagehide',()=>{generation++;stopVoices()});
window.addEventListener('nox-space-locked',()=>{generation++;enabled=false;stopVoices();palette=null;status.textContent='Private space locked. Interface sounds are off. Enable them again to use cybernetic or remembered custom sounds.';update()});
const cancelHover=installHoverSounds({isEnabled:()=>enabled&&!!palette&&hoverEnabled&&volume>0&&!document.hidden,play:kind=>cue(kind)});
update();
// Read-only diagnostics expose counts, never source audio or private file metadata.
export function getInterfaceSoundState(){return {...diagnostics,enabled,ready:!!palette,voices:voices.size,volume,hoverEnabled,paletteKind};}
