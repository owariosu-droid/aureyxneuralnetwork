import test from 'node:test';
import assert from 'node:assert/strict';
import {createCyberneticPalette,createHoverCue} from '../cybernetic-sounds.js';
const context={createBuffer(channels,length,sampleRate){const data=Array.from({length:channels},()=>new Float32Array(length));return{numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,getChannelData:n=>data[n],copyToChannel:(samples,n)=>data[n].set(samples)}}};
const peak=samples=>samples.reduce((largest,sample)=>Math.max(largest,Math.abs(sample)),0);
const rms=samples=>Math.sqrt(samples.reduce((sum,sample)=>sum+sample*sample,0)/samples.length);
function checkBuffer(buffer,duration){const samples=buffer.getChannelData(0);assert.equal(buffer.sampleRate,22050);assert.equal(buffer.numberOfChannels,1);assert.ok(Math.abs(buffer.duration-duration)<.0001);assert.equal(samples[0],0);assert.equal(samples.at(-1),0);assert.ok(peak(samples)>.005&&peak(samples)<=.4);assert.ok(rms(samples)>.001);assert.ok(samples.every(Number.isFinite));const first=samples.subarray(0,Math.round(22050*.002)),last=samples.subarray(-Math.round(22050*.002));assert.ok(peak(first)<peak(samples)*.5);assert.ok(peak(last)<peak(samples)*.5);}
test('five original cybernetic cues are short, gentle, finite, and smoothly bounded',()=>{
 const palette=createCyberneticPalette(context);assert.deepEqual(Object.keys(palette).sort(),['click','confirm','hover','navigate','toggle']);
 for(const [name,duration]of Object.entries({hover:.058,click:.105,toggle:.165,navigate:.3,confirm:.45}))checkBuffer(palette[name],duration);
 assert.ok(peak(palette.hover.getChannelData(0))<peak(palette.click.getChannelData(0)));
});
test('builtin sounds are deterministic and each has a distinct waveform',()=>{
 const first=createCyberneticPalette(context),second=createCyberneticPalette(context);const signatures=new Set();
 for(const name of Object.keys(first)){const samples=first[name].getChannelData(0);assert.deepEqual(samples,second[name].getChannelData(0));signatures.add(Array.from(samples.slice(0,100)).join(','));}
 assert.equal(signatures.size,5);
});
function customClick(frequency){const buffer=context.createBuffer(1,2646,22050),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++){const progress=i/(samples.length-1);samples[i]=.3*Math.sin(i/22050*Math.PI*2*frequency)*Math.sin(progress*Math.PI)**2;}return buffer;}
test('legacy imported click generates a quieter short hover while retaining source differences',()=>{
 const click=customClick(250),hover=createHoverCue(click,context),other=createHoverCue(customClick(880),context);checkBuffer(hover,.058);assert.ok(peak(hover.getChannelData(0))<=peak(click.getChannelData(0))*.501);assert.notDeepEqual(hover.getChannelData(0),other.getChannelData(0));assert.notDeepEqual(hover.getChannelData(0),createCyberneticPalette(context).hover.getChannelData(0));
});
test('custom silent click stays silent and invalid buffers are rejected',()=>{
 const silent=context.createBuffer(1,2646,22050);assert.equal(peak(createHoverCue(silent,context).getChannelData(0)),0);assert.throws(()=>createCyberneticPalette(null),/context/);assert.throws(()=>createHoverCue(null,context),/invalid/);assert.throws(()=>createHoverCue(context.createBuffer(1,22050*2,22050),context),/invalid/);const bad=customClick(220);bad.getChannelData(0)[9]=NaN;assert.throws(()=>createHoverCue(bad,context),/invalid samples/);
});
