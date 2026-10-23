import './style.css';
import {listeningPreferences,saveListeningPreference} from './listening-ui.js';
import './offline.js';
import './community.js';
import { AudioResponse } from './audio-response.js';
import { navigate } from './navigation.js';
import { createDreamscape } from './dreamscape.js';
const dream=createDreamscape(document.querySelector('#dreamscape'));
let intensity=listeningPreferences.intensity/100;document.querySelector('#intensity').value=listeningPreferences.intensity;document.querySelector('#intensity-value').textContent=`${listeningPreferences.intensity}%`;document.querySelector('#intensity').oninput=e=>{intensity=Number(e.target.value)/100;document.querySelector('#intensity-value').textContent=`${e.target.value}%`;saveListeningPreference('intensity',Number(e.target.value))};
const $=s=>document.querySelector(s);const audio=$('#audio');let context,analyser,source,url,proofFile;const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');let motion=!reducedMotion.matches&&listeningPreferences.motion;
$('#year').textContent=new Date().getFullYear();
function updateMotion(){document.body.classList.toggle('reduced',!motion);$('#motion').textContent=`Motion: ${motion?'on':'off'}`;$('#motion').setAttribute('aria-pressed',String(motion))}updateMotion();$('#motion').onclick=()=>{motion=!motion;saveListeningPreference('motion',motion);updateMotion()};reducedMotion.addEventListener('change',e=>{if(e.matches){motion=false;updateMotion()}});
window.addEventListener('pointermove',e=>{if(!motion)return;document.documentElement.style.setProperty('--depth-x',`${(e.clientX/innerWidth-.5)*22}px`);document.documentElement.style.setProperty('--depth-y',`${(e.clientY/innerHeight-.5)*18}px`);document.documentElement.style.setProperty('--px',`${(e.clientX/innerWidth-.5)*14}px`);document.documentElement.style.setProperty('--py',`${(e.clientY/innerHeight-.5)*10}px`)});
$('#enter').onclick=()=>{navigate('/listen');if(!audio.src)$('#audio-file').click();else play()};
function loadSong(file){if(!file)return;if(!file.size){$('#playback-status').textContent='This file is empty. Choose an audio file with content.';return}if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(file);audio.src=url;$('#song-title').textContent=file.name.replace(/\.[^.]+$/,'');$('#play').disabled=false;$('#seek').disabled=false;play()}
$('#audio-file').onchange=e=>loadSong(e.target.files[0]);
window.addEventListener('nox-play-original',event=>loadSong(event.detail));
async function play(){try{if(!context){context=new AudioContext();analyser=context.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.2;source=context.createMediaElementSource(audio);source.connect(analyser);analyser.connect(context.destination)}await context.resume();await audio.play()}catch(error){$('#playback-status').textContent=error.name==='NotAllowedError'?'Your browser needs a tap on Play to start audio.':'This audio could not be played. Try MP3, WAV, or another supported format.';}}
$('#play').onclick=()=>audio.paused?play():audio.pause();audio.onplay=()=>{$('#play').textContent='Ⅱ';$('#play').setAttribute('aria-label','Pause song')};audio.onpause=()=>{$('#play').textContent='▶';$('#play').setAttribute('aria-label','Play song')};audio.onended=()=>{$('#play').textContent='▶';$('#seek').value=0};
const format=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;audio.ontimeupdate=()=>{$('#time').textContent=format(audio.currentTime);if(Number.isFinite(audio.duration))$('#seek').value=audio.currentTime/audio.duration*100};$('#seek').oninput=e=>{if(Number.isFinite(audio.duration))audio.currentTime=e.target.value/100*audio.duration};$('#mute').onclick=()=>{audio.muted=!audio.muted;$('#mute').textContent=audio.muted?'×':'◖';$('#mute').setAttribute('aria-label',audio.muted?'Unmute audio':'Mute audio')};
const data=new Uint8Array(1024);
const bars=Array.from({length:24},()=>{const bar=document.createElement('i');$('.equalizer').append(bar);return bar});
const response=new AudioResponse(), waveform=new Float32Array(2048);let lastFrame=0;
for(const event of ['seeking','seeked','emptied','play','pause','ended','waiting'])audio.addEventListener(event,()=>response.reset());
document.addEventListener('visibilitychange',()=>{response.reset();lastFrame=0});
function band(low,high){const step=context.sampleRate/analyser.fftSize;let sum=0,count=0;for(let i=Math.max(1,Math.floor(low/step));i<Math.min(data.length,Math.ceil(high/step));i++){sum+=data[i]/255;count++}return count?sum/count:0}
function animate(now){
 const dt=Math.min(.1,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
 const active=!!(analyser&&!audio.paused&&!audio.ended&&!audio.muted&&audio.volume>0&&!audio.seeking&&audio.readyState>=3&&motion&&!document.hidden);
 let b=0,m=0,h=0,rms=0;
 if(active){analyser.getByteFrequencyData(data);analyser.getFloatTimeDomainData(waveform);b=band(30,250);m=band(250,2500);h=band(2500,12000);for(const sample of waveform)rms+=sample*sample;rms=Math.sqrt(rms/waveform.length);}
 const state=response.step({bass:b,mids:m,highs:h,rms,active},dt);
 if(state.hit)dream.hit(intensity*state.hit);
 const root=document.documentElement.style;
 for(const key of ['bass','mids','highs','beat'])root.setProperty(`--${key}`,motion?state[key]:0);
 root.setProperty('--energy',motion?state.bass:0);root.setProperty('--sound-hue','0deg');
 root.setProperty('--playback-boost',motion?state.boost*intensity:0);
 document.body.classList.toggle('sound-active',active&&rms>.003);
 dream.draw(now,dt,{...state,active,motion,intensity});
 bars.forEach((bar,i)=>{const value=active?data[Math.min(data.length-1,Math.round(2*Math.pow(420,i/23))) ]/255:0;bar.style.transform=`scaleY(${.08+value*.92})`});
 requestAnimationFrame(animate);
}requestAnimationFrame(animate);
$('#proof-file').onchange=e=>{proofFile=e.target.files[0];$('#proof-name').textContent=proofFile?proofFile.name:'Choose your original file'};
import './vault-store.js';

window.addEventListener('scroll',()=>{document.documentElement.style.setProperty('--scroll-depth',`${motion?Math.min(scrollY*.12,90):0}px`)},{passive:true});

window.addEventListener('nox-space-locked',()=>{audio.pause();audio.removeAttribute('src');audio.load();if(url)URL.revokeObjectURL(url);url=null;$('#song-title').textContent='No song loaded';$('#time').textContent='0:00';$('#seek').value=0;$('#play').disabled=true;$('#seek').disabled=true;$('#now-playing').hidden=true;});
