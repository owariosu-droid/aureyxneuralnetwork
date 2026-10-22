const clamp = (value, low=0, high=1) => Math.min(high, Math.max(low, Number.isFinite(value) ? value : 0));
const follow = (value, target, dt, attack, release) => value + (target-value)*(1-Math.exp(-dt/(target>value?attack:release)));
export class AudioResponse {
  constructor() { this.bass=0;this.mids=0;this.highs=0;this.beat=0;this.boost=0;this.reset(); }
  reset() { this.baseline=0;this.previous=0;this.warmup=0;this.sinceBeat=1;this.beat=0; }
  step({bass=0,mids=0,highs=0,rms=0,active=false}, elapsed) {
    const dt=clamp(elapsed,0,.05);this.sinceBeat+=dt;
    const audible=active&&rms>.003;
    let hit=0;
    if(audible){
      bass=clamp(bass);mids=clamp(mids);highs=clamp(highs);
      this.warmup+=dt;
      const onset=Math.max(0,bass-this.previous);
      if(this.warmup>.25&&this.sinceBeat>.28&&bass>.16&&onset>.035&&bass>this.baseline*1.18){hit=clamp(onset*3,.25,.8);this.beat=hit;this.sinceBeat=0;}
      this.baseline=follow(this.baseline,bass,dt,.16,.3);this.previous=bass;
    }else{bass=0;mids=0;highs=0;this.reset();}
    this.bass=follow(this.bass,bass,dt,.045,.22);
    this.mids=follow(this.mids,mids,dt,.1,.35);
    this.highs=follow(this.highs,highs,dt,.08,.25);
    this.beat*=Math.exp(-dt*8);
    this.boost=follow(this.boost,audible?clamp(.4+rms*2+this.mids*.35):0,dt,.35,.55);
    return {bass:this.bass,mids:this.mids,highs:this.highs,beat:this.beat,boost:this.boost,hit};
  }
}
