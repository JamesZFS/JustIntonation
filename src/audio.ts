export type Timbre = 'piano'|'soft'|'saw'|'organ'|'sine';
interface Voice {gain:GainNode; sources:AudioScheduledSourceNode[]; start:number; release?:number; end?:number; level:number}
export class Instrument {
  context?:AudioContext; master?:GainNode; voices = new Map<string,Voice>();
  timbre:Timbre='soft'; sustain=true; volume=.65;
  samples = new Map<number,AudioBuffer>(); loading?:Promise<void>;
  onStatus:(message:string)=>void=()=>{};
  async init() {
    if(!this.context) {
      this.context=new AudioContext(); this.master=this.context.createGain();
      const compressor=this.context.createDynamicsCompressor(); compressor.threshold.value=-15; compressor.ratio.value=5;
      this.master.gain.value=this.volume*.32;this.master.connect(compressor);compressor.connect(this.context.destination);
    }
    await this.context.resume();
  }
  setVolume(value:number) {this.volume=value;this.master?.gain.setTargetAtTime(value*.32,this.context!.currentTime,.03);}
  async loadPiano() {
    if(this.samples.size) return;
    if(this.loading)return this.loading;
    this.loading=(async()=>{
      await this.init();this.onStatus('Loading piano samples…');
      const entries:[[number,string],[number,string],[number,string],[number,string],[number,string]]=[[48,'C3'],[57,'A3'],[60,'C4'],[69,'A4'],[72,'C5']];
      const buffers=await Promise.all(entries.map(async([midi,name])=>{
        const response=await fetch(`${import.meta.env.BASE_URL}samples/${name}.mp3`);
        if(!response.ok)throw new Error('Sample unavailable');
        return [midi,await this.context!.decodeAudioData(await response.arrayBuffer())] as const;
      }));
      buffers.forEach(([midi,buffer])=>this.samples.set(midi,buffer));this.onStatus('Piano samples ready');
    })().catch(()=>{this.onStatus('Piano samples unavailable · choose a synth voice');throw new Error('Unable to load piano samples');}).finally(()=>{this.loading=undefined;});
    return this.loading;
  }
  attack(id:string,frequency:number) {
    const ctx=this.context;if(!ctx||!this.master)return;
    this.stop(id);const now=ctx.currentTime;const gain=ctx.createGain();gain.connect(this.master);
    const sources:AudioScheduledSourceNode[]=[];let level=.7;
    if(this.timbre==='piano') {
      if(!this.samples.size)return;
      const midi=69+12*Math.log2(frequency/440);
      const nearest=[...this.samples.keys()].sort((a,b)=>Math.abs(a-midi)-Math.abs(b-midi))[0];
      const src=ctx.createBufferSource();src.buffer=this.samples.get(nearest)!;
      src.playbackRate.value=frequency/(440*2**((nearest-69)/12));src.connect(gain);src.start();sources.push(src);
      gain.gain.setValueAtTime(.85,now);level=.85;
    }else{
      const harmonics=this.timbre==='organ'?[[1,.65],[2,.28],[3,.16],[4,.09]]:this.timbre==='soft'?[[1,.72],[2,.18],[3,.04]]:[[1,.65]];
      let target:AudioNode=gain;
      if(this.timbre==='saw'){const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=2600;filter.Q.value=.6;filter.connect(gain);target=filter;}
      for(const [harmonic,amplitude] of harmonics){
        const osc=ctx.createOscillator();osc.type=this.timbre==='saw'?'sawtooth':'sine';osc.frequency.value=frequency*harmonic;
        const partial=ctx.createGain();partial.gain.value=amplitude;osc.connect(partial);partial.connect(target);osc.start();sources.push(osc);
      }
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(level,now+.012);
      if(this.timbre==='soft'){gain.gain.exponentialRampToValueAtTime(.26,now+1.4);}
    }
    this.voices.set(id,{gain,sources,start:now,level});
  }
  release(id:string) {
    const v=this.voices.get(id);const ctx=this.context;if(!v||!ctx||v.release!==undefined)return;
    const now=ctx.currentTime;const duration=this.sustain?5.5:.18;
    v.release=now;v.end=now+duration;
    v.gain.gain.cancelAndHoldAtTime(now);v.gain.gain.exponentialRampToValueAtTime(.0001,v.end);
    v.sources.forEach(s=>{try{s.stop(v.end!+.03);}catch{}});
  }
  tail(id:string) {const v=this.voices.get(id);if(!v||v.release===undefined||!this.context)return 0;return Math.max(0,Math.exp(-9*(this.context.currentTime-v.release)/(v.end!-v.release)));}
  stop(id:string) {const v=this.voices.get(id);if(v){v.sources.forEach(s=>{try{s.stop();}catch{}});v.gain.disconnect();this.voices.delete(id);}}
  setSustain(enabled:boolean) {this.sustain=enabled;if(!enabled){for(const [id,v] of this.voices)if(v.release!==undefined){v.release=undefined;this.release(id);}}}
  panic(){for(const id of this.voices.keys())this.stop(id);}
  cleanup(){if(this.context)for(const [id,v]of this.voices)if(v.end&&v.end<this.context.currentTime)this.stop(id);}
}
