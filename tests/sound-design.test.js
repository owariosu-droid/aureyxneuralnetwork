import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveSoundPalette,packPalette,unpackPalette} from '../sound-design.js';
const context={createBuffer(channels,length,sampleRate){const data=Array.from({length:channels},()=>new Float32Array(length));return{numberOfChannels:channels,length,sampleRate,duration:length/sampleRate,getChannelData:n=>data[n],copyToChannel:(samples,n)=>data[n].set(samples)}}};
function source(frequency=220){const b=context.createBuffer(1,44100*3,44100),data=b.getChannelData(0);for(let i=15000;i<data.length;i++)data[i]=.2*Math.sin(i/44100*2*Math.PI*frequency)+.07*Math.sin(i/44100*2*Math.PI*(frequency*1.5));return b;}
test('four cues preserve source character with short durations, soft endpoints and bounded peaks',async()=>{
 const palette=await deriveSoundPalette(source(),context);
 for(const [name,duration]of Object.entries({click:.12,toggle:.2,navigate:.38,confirm:.5})){const b=palette[name],data=b.getChannelData(0);assert.equal(b.sampleRate,22050);assert.equal(b.numberOfChannels,1);assert.ok(Math.abs(b.duration-duration)<.0001);assert.equal(data[0],0);assert.equal(data.at(-1),0);let peak=0;for(const sample of data){assert.ok(Number.isFinite(sample));peak=Math.max(peak,Math.abs(sample))}assert.ok(peak>.01&&peak<=.5)}
 const different=await deriveSoundPalette(source(880),context);assert.notDeepEqual([...palette.click.getChannelData(0)],[...different.click.getChannelData(0)]);
});
test('a small palette round-trips with bounded quantization error',async()=>{
 const palette=await deriveSoundPalette(source(),context),packed=packPalette(palette),restored=unpackPalette(packed,context);assert.ok(JSON.stringify(packed).length<100000);
 for(const name of Object.keys(palette)){const a=palette[name].getChannelData(0),b=restored[name].getChannelData(0);assert.equal(a.length,b.length);for(let i=0;i<a.length;i++)assert.ok(Math.abs(a[i]-b[i])<.00004)}
});
test('silent or too-short source and corrupt/oversized palette data are rejected',async()=>{
 await assert.rejects(deriveSoundPalette(context.createBuffer(1,22050,22050),context),/No usable/);
 await assert.rejects(deriveSoundPalette(context.createBuffer(1,100,22050),context),/too short/);
 const packed=packPalette(await deriveSoundPalette(source(),context));
 assert.throws(()=>unpackPalette({...packed,sampleRate:999999},context),/supported/);
 const invalid=structuredClone(packed);invalid.cues.click.samples=22050*100;assert.throws(()=>unpackPalette(invalid,context),/invalid/);
 const hot=structuredClone(packed);const bytes=Buffer.from(hot.cues.click.pcm16,'base64');bytes.writeInt16LE(32767,4);hot.cues.click.pcm16=bytes.toString('base64');assert.throws(()=>unpackPalette(hot,context),/peak/);
});
