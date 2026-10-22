import './style.css';
import { navigate } from './navigation.js';
import { createDreamscape } from './dreamscape.js';
const dream=createDreamscape(document.querySelector('#dreamscape'));
let intensity=.65;document.querySelector('#intensity').oninput=e=>{intensity=Number(e.target.value)/100;document.querySelector('#intensity-value').textContent=`${e.target.value}%`};
const $=s=>document.querySelector(s);const audio=$('#audio');let context,analyser,source,url,proofFile;const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');let motion=!reducedMotion.matches;
$('#year').textContent=new Date().getFullYear();
function updateMotion(){document.body.classList.toggle('reduced',!motion);$('#motion').textContent=`Motion: ${motion?'on':'off'}`;$('#motion').setAttribute('aria-pressed',String(motion))}updateMotion();$('#motion').onclick=()=>{motion=!motion;updateMotion()};reducedMotion.addEventListener('change',e=>{if(e.matches){motion=false;updateMotion()}});
window.addEventListener('pointermove',e=>{if(!motion)return;document.documentElement.style.setProperty('--depth-x',`${(e.clientX/innerWidth-.5)*22}px`);document.documentElement.style.setProperty('--depth-y',`${(e.clientY/innerHeight-.5)*18}px`);document.documentElement.style.setProperty('--px',`${(e.clientX/innerWidth-.5)*14}px`);document.documentElement.style.setProperty('--py',`${(e.clientY/innerHeight-.5)*10}px`)});
$('#enter').onclick=()=>{navigate('/listen');if(!audio.src)$('#audio-file').click();else play()};
$('#audio-file').onchange=e=>{const file=e.target.files[0];if(!file)return;if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(file);audio.src=url;$('#song-title').textContent=file.name.replace(/\.[^.]+$/,'');$('#play').disabled=false;$('#seek').disabled=false;play()};
async function play(){try{if(!context){context=new AudioContext();analyser=context.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.65;source=context.createMediaElementSource(audio);source.connect(analyser);analyser.connect(context.destination)}await context.resume();await audio.play()}catch{$('#song-title').textContent='Unable to play this file. Try MP3 or WAV.'}}
$('#play').onclick=()=>audio.paused?play():audio.pause();audio.onplay=()=>{$('#play').textContent='Ⅱ';$('#play').setAttribute('aria-label','Pause song')};audio.onpause=()=>{$('#play').textContent='▶';$('#play').setAttribute('aria-label','Play song')};audio.onended=()=>{$('#play').textContent='▶';$('#seek').value=0};
const format=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;audio.ontimeupdate=()=>{$('#time').textContent=format(audio.currentTime);if(Number.isFinite(audio.duration))$('#seek').value=audio.currentTime/audio.duration*100};$('#seek').oninput=e=>{if(Number.isFinite(audio.duration))audio.currentTime=e.target.value/100*audio.duration};$('#mute').onclick=()=>{audio.muted=!audio.muted;$('#mute').textContent=audio.muted?'×':'◖';$('#mute').setAttribute('aria-label',audio.muted?'Unmute audio':'Mute audio')};
const data=new Uint8Array(1024);
const bars=Array.from({length:24},()=>{const bar=document.createElement('i');$('.equalizer').append(bar);return bar});
let bass=0,mids=0,highs=0,beat=0,average=.08,lastBeat=0,lastFrame=0,previousBass=0,previousHigh=0;
function band(low,high){const step=context.sampleRate/analyser.fftSize;let sum=0,count=0;for(let i=Math.max(1,Math.floor(low/step));i<Math.min(data.length,Math.ceil(high/step));i++){sum+=data[i]/255;count++}return count?sum/count:0}
function animate(now){
 const dt=Math.min(.1,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
 const active=analyser&&!audio.paused&&!audio.ended&&!audio.muted&&motion&&!document.hidden;
 let b=0,m=0,h=0;
 if(active){analyser.getByteFrequencyData(data);b=band(30,250);m=band(250,2500);h=band(2500,12000);average+=(b-average)*(1-Math.exp(-dt*2));if(((b>.12&&b>average*1.25&&b-previousBass>.012)||(h>.04&&h-previousHigh>.025))&&now-lastBeat>280){beat=1;lastBeat=now;dream.hit(intensity,now)}previousBass=b;previousHigh=h;}
 const smoothing=1-Math.exp(-dt*9);bass+=(b-bass)*smoothing;mids+=(m-mids)*smoothing;highs+=(h-highs)*smoothing;beat*=Math.exp(-dt*5);
 const root=document.documentElement.style;
 root.setProperty('--energy',motion?bass:0);root.setProperty('--bass',motion?bass:0);root.setProperty('--mids',motion?mids:0);root.setProperty('--highs',motion?highs:0);root.setProperty('--beat',motion?beat:0);
 root.setProperty('--sound-hue',`${motion?mids*55-highs*35:0}deg`);
 document.body.classList.toggle('sound-active',!!active);
 dream.draw(now,dt,{bass,mids,highs,beat,active,motion,intensity});
 bars.forEach((bar,i)=>{const value=active?data[Math.min(data.length-1,Math.round(2*Math.pow(420,i/23))) ]/255:0;bar.style.transform=`scaleY(${.08+value*.92})`});
 requestAnimationFrame(animate);
}requestAnimationFrame(animate);
$('#proof-file').onchange=e=>{proofFile=e.target.files[0];$('#proof-name').textContent=proofFile?proofFile.name:'Choose your original file'};
import './vault-store.js';

window.addEventListener('scroll',()=>{document.documentElement.style.setProperty('--scroll-depth',`${motion?Math.min(scrollY*.12,90):0}px`)},{passive:true});
