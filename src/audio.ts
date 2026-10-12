export type Timbre = 'piano'|'soft'|'saw'|'organ'|'sine';
interface Voice {id:string; timbre:Timbre; gain:GainNode; sources:AudioScheduledSourceNode[]; start:number; release?:number; end?:number; fadeStart?:number; fadeLevel?:number; fadeGain?:number; fadeDuration?:number; releaseGain?:number; releaseDuration?:number; naturalEnd?:number; level:number}
export class Instrument {
  context?:AudioContext; master?:GainNode; voices = new Map<string,Voice>();
  timbre:Timbre='soft'; sustain=true; volume=.65; releaseLength=5.5;
  private tails = new Set<Voice>();
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
    if(this.timbre==='piano'&&!this.samples.size)return;
    // A retrigger gets its own voice; the previous tail stays connected until silent.
    const previous=this.voices.get(id);
    if(previous){this.tails.add(previous);if(previous.release===undefined)this.fade(previous,.03);}
    const now=ctx.currentTime;const gain=ctx.createGain();gain.connect(this.master);
    const sources:AudioScheduledSourceNode[]=[];let level=.7;let naturalEnd:number|undefined;
    if(this.timbre==='piano') {
      const midi=69+12*Math.log2(frequency/440);
      const nearest=[...this.samples.keys()].sort((a,b)=>Math.abs(a-midi)-Math.abs(b-midi))[0];
      const src=ctx.createBufferSource();src.buffer=this.samples.get(nearest)!;
      src.playbackRate.value=frequency/(440*2**((nearest-69)/12));src.connect(gain);src.start();sources.push(src);naturalEnd=now+src.buffer.duration/src.playbackRate.value;
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
    this.voices.set(id,{id,timbre:this.timbre,gain,sources,start:now,level,naturalEnd,end:naturalEnd});
  }
  private gainAt(voice:Voice,time:number):number {
    if(voice.fadeStart!==undefined)return (voice.fadeGain??0)*Math.max(0,1-(time-voice.fadeStart)/(voice.fadeDuration??.1));
    if(voice.release!==undefined&&voice.timbre!=='piano'){
      const elapsed=time-voice.release;
      const duration=voice.releaseDuration??5.5;
      if(elapsed>=duration)return .0001*Math.max(0,1-(elapsed-duration)/.03);
      const from=voice.releaseGain??voice.level;
      return from>0 ? from*(.0001/from)**(elapsed/duration) : 0;
    }
    if(voice.timbre==='piano')return voice.level;
    const elapsed=time-voice.start;
    if(elapsed<.012)return voice.level*Math.max(0,elapsed/.012);
    if(voice.timbre==='soft'&&elapsed<1.4)return voice.level*(.26/voice.level)**((elapsed-.012)/(1.4-.012));
    return voice.timbre==='soft'?.26:voice.level;
  }
  private holdGain(voice:Voice,now:number):number {
    // Explicitly pin the known envelope value: cancelling a future ramp must
    // never jump back to an earlier AudioParam value.
    const gain=this.gainAt(voice,now);
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(gain,now);
    return gain;
  }
  private fade(voice:Voice,duration:number) {
    const now=this.context!.currentTime;
    const currentTail=this.voiceTail(voice);
    const gain=this.holdGain(voice,now);
    // A linear fade reaches silence in 100 ms rather than dropping most of its
    // amplitude in the first few milliseconds of an exponential release.
    voice.gain.gain.linearRampToValueAtTime(0,now+duration);
    voice.fadeStart=now;voice.fadeLevel=currentTail;voice.fadeGain=gain;voice.fadeDuration=duration;
    voice.end=Math.min(voice.naturalEnd??Infinity,now+duration);
    for(const source of voice.sources){try{source.stop(voice.end);}catch{}}
  }
  release(id:string) {
    const voice=this.voices.get(id);const ctx=this.context;
    if(!voice||!ctx||voice.release!==undefined)return;
    const releaseGain=this.gainAt(voice,ctx.currentTime);
    voice.releaseGain=releaseGain;voice.release=ctx.currentTime;
    if(!this.sustain){this.fade(voice,.1);return;}
    // Piano recordings already contain their decay: note-off with the pedal on
    // changes only the visual state, never the sample's gain or playback end.
    if(voice.timbre==='piano')return;
    const now=ctx.currentTime;
    this.holdGain(voice,now);
    if(releaseGain<=0)voice.gain.gain.setValueAtTime(.0001,now);
    // Capture the selected length so later slider changes do not disturb tails.
    voice.releaseDuration=this.releaseLength;
    voice.gain.gain.exponentialRampToValueAtTime(.0001,now+voice.releaseDuration);
    voice.gain.gain.linearRampToValueAtTime(0,now+voice.releaseDuration+.03);
    voice.end=now+voice.releaseDuration+.03;
    for(const source of voice.sources){try{source.stop(voice.end);}catch{}}
  }
  private voiceTail(voice:Voice):number {
    if(!this.context)return 0;
    const now=this.context.currentTime;
    if(voice.end!==undefined&&now>=voice.end)return 0;
    if(voice.fadeStart!==undefined)return (voice.fadeLevel??1)*Math.max(0,1-(now-voice.fadeStart)/Math.max(.001,voice.end!-voice.fadeStart));
    if(voice.naturalEnd!==undefined)return Math.exp(-6*(now-voice.start)/(voice.naturalEnd-voice.start));
    if(voice.release===undefined)return 1;
    return Math.exp(-9*(now-voice.release)/(voice.releaseDuration??5.5));
  }
  tail(id:string) {
    let level=0;
    const voice=this.voices.get(id);
    if(voice?.release!==undefined)level=this.voiceTail(voice);
    for(const tail of this.tails)if(tail.id===id)level=Math.max(level,this.voiceTail(tail));
    return level;
  }
  stop(id:string) {
    const voice=this.voices.get(id);
    if(voice){this.voices.delete(id);this.tails.add(voice);this.fade(voice,.03);}
  }
  setSustain(enabled:boolean) {
    this.sustain=enabled;
    if(!enabled)for(const voice of [...this.voices.values(),...this.tails])if(voice.release!==undefined)this.fade(voice,.1);
  }
  panic(){
    for(const voice of [...this.voices.values(),...this.tails]){this.fade(voice,.03);this.tails.add(voice);}
    this.voices.clear();
  }
  private dispose(voice:Voice){voice.gain.disconnect();}
  cleanup(){
    if(!this.context)return;
    for(const [id,voice]of this.voices)if(voice.end!==undefined&&voice.end<=this.context.currentTime){this.dispose(voice);this.voices.delete(id);}
    for(const voice of this.tails)if(voice.end!==undefined&&voice.end<=this.context.currentTime){this.dispose(voice);this.tails.delete(voice);}
  }
}
