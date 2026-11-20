import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioResponse} from '../audio-response.js';
const input={bass:.4,mids:.3,highs:.2,rms:.15,active:true};
function run(state,signal,seconds,rate=60){let value;for(let i=0;i<seconds*rate;i++)value=state.step(signal,1/rate);return value;}
test('playing boosts color smoothly, while paused, muted or silent input settles to idle',()=>{
 const response=new AudioResponse();const first=response.step(input,1/60);assert.ok(first.boost<.1);
 assert.ok(run(response,input,2).boost>.5);
 for(const signal of [{...input,active:false},{...input,rms:0}]){run(response,input,1);const result=run(response,signal,5);assert.ok(result.boost<.001);assert.ok(result.bass<.001);assert.equal(result.hit,0)}
});
test('warmup suppresses false starts, steady tones and treble jitter do not cause repeated beats',()=>{
 const response=new AudioResponse();assert.equal(response.step(input,1/60).hit,0);
 let hits=0;for(let i=0;i<300;i++){if(response.step({...input,highs:i%2?.9:.1},1/60).hit)hits++;}assert.equal(hits,0);
 response.reset();assert.equal(response.step({...input,bass:1},1/60).hit,0);
});
test('bass transients trigger a bounded response and cooldown suppresses double hits',()=>{
 const response=new AudioResponse();run(response,{...input,bass:.05},.5);
 const onset=response.step({...input,bass:.7},1/60);assert.ok(onset.hit>0&&onset.hit<=.8);
 response.step({...input,bass:.05},1/60);assert.equal(response.step({...input,bass:.9},1/60).hit,0);
});
test('envelopes are frame-rate independent and ignore nonfinite inputs',()=>{
 const low=run(new AudioResponse(),input,1,30),high=run(new AudioResponse(),input,1,120);
 assert.ok(Math.abs(low.boost-high.boost)<.001);assert.ok(Math.abs(low.bass-high.bass)<.001);
 const bad=new AudioResponse().step({active:true,bass:NaN,mids:Infinity,highs:-4,rms:.2},.016);
 for(const value of Object.values(bad))assert.ok(Number.isFinite(value));
});
test('heavy sustained bass has much stronger regional drive than mids or treble',()=>{
 const bass=run(new AudioResponse(),{bass:.85,mids:.12,highs:.08,rms:.25,active:true},1);
 const bright=run(new AudioResponse(),{bass:.07,mids:.6,highs:.9,rms:.25,active:true},1);
 assert.ok(bass.surge>.9);assert.equal(bright.surge,0);
});
test('regional bass drive rises smoothly and settles through pause and silence',()=>{
 const response=new AudioResponse(),signal={bass:.85,mids:.12,highs:.08,rms:.25,active:true};
 const first=response.step(signal,1/60);assert.ok(first.surge>0&&first.surge<.25);
 run(response,signal,1);const paused=run(response,{...signal,active:false},5);assert.ok(paused.surge<.001);
 run(response,signal,1);assert.ok(run(response,{...signal,rms:0},5).surge<.001);
});
test('regional bass drive is stable across frame rates and reset does not kick it',()=>{
 const signal={bass:.85,mids:.12,highs:.08,rms:.25,active:true};
 const low=run(new AudioResponse(),signal,1,30),high=run(new AudioResponse(),signal,1,120);
 assert.ok(Math.abs(low.surge-high.surge)<.001);
 const response=new AudioResponse();run(response,signal,1);const before=response.surge;response.reset();assert.equal(response.surge,before);assert.equal(response.step(signal,1/60).hit,0);
});
