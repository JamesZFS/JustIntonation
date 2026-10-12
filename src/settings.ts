import type {Timbre} from './audio';
import type {Tuning} from './tuning';
export type Scale = 'chromatic' | 'diatonic' | 'pentatonic';
export type View = 'hex' | 'dual';
export type Labels = 'ratio' | 'octave' | 'note' | 'none';
export interface Settings {
  view:View; tuning:Tuning; scale:Scale; sustain:boolean; borders:boolean; unfolded:boolean; labels:Labels;
  voice:Timbre; volume:number; releaseLength:number; keyboardOctave:number; zoom:number; rotation:number; panX:number; panY:number;
}
export const STORAGE_KEY='temper.settings.v1';
export const defaults:Readonly<Settings>={view:'hex',tuning:'ji',scale:'chromatic',sustain:true,borders:false,unfolded:false,labels:'octave',voice:'soft',volume:.65,releaseLength:5.5,keyboardOctave:3,zoom:1,rotation:0,panX:0,panY:0};
export function allowsPitch(pc:number,scale:Scale):boolean {
  return scale==='chromatic'||(scale==='diatonic'?[0,2,4,5,7,9,11]:[0,2,4,7,9]).includes(pc);
}
export function validateSettings(value:unknown):Settings {
  const result={...defaults};
  if(!value||typeof value!=='object')return result;
  const input=value as Record<string,unknown>;
  const choices={view:['hex','dual'],tuning:['ji','12tet'],scale:['chromatic','diatonic','pentatonic'],labels:['ratio','octave','note','none'],voice:['piano','soft','saw','organ','sine']} as const;
  for(const key of Object.keys(choices) as (keyof typeof choices)[]) {
    const candidate=input[key];
    if(typeof candidate==='string'&&(choices[key] as readonly string[]).includes(candidate))Object.assign(result,{[key]:candidate});
  }
  for(const key of ['sustain','borders','unfolded'] as const)if(typeof input[key]==='boolean')result[key]=input[key];
  for(const [key,min,max]of [['volume',0,1],['releaseLength',.1,12],['keyboardOctave',1,5],['zoom',.65,1.7],['rotation',0,330],['panX',-450,450],['panY',-350,350]] as const){
    const candidate=input[key];
    if(typeof candidate==='number'&&Number.isFinite(candidate)&&candidate>=min&&candidate<=max&&(key!=='keyboardOctave'||Number.isInteger(candidate))&&(key!=='rotation'||candidate%30===0))result[key]=candidate;
  }
  return result;
}
export function readSettings():Settings {
  try{return validateSettings(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'));}catch{return {...defaults};}
}
export function writeSettings(settings:Settings):void {
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));}catch{/* The instrument remains usable if storage is unavailable. */}
}
