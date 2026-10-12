import './style.css';
import {Instrument, type Timbre} from './audio';
import {latticeNote,pianoNote,black,type Tuning,type Note} from './tuning';
import {allowsPitch,defaults,readSettings,writeSettings,type Scale,type Labels} from './settings';
const savedSettings=readSettings();
const icon=(name:string)=>({sound:'◖))',grid:'⬡',arrow:'↗',reset:'↺'}[name]||'');
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`
<header><a class="brand" href="./" aria-label="Temper home"><span class="brand-symbol">◈</span> temper<span class="brand-dot">.</span></a><div class="edition">AN EXPLORATION IN PURE HARMONY</div><button id="help" class="text-button">How to play <span>↗</span></button></header>
<main>
<div class="intro"><div><div class="eyebrow"><span></span> THE JUST INTONATION STUDIO</div><h1>A little closer to <em>harmony.</em></h1><p>Pure ratios. Connected notes. A different way to play.</p></div><div class="tuning-tag"><span class="tiny-grid">✳</span><div><strong id="tuning-title">5-limit tuning</strong><span id="tuning-subtitle">Built on 2, 3 & 5</span></div></div></div>
<section class="workspace" aria-label="Just intonation instrument">
<div class="toolbar"><div class="view-tabs"><button class="selected" id="tonnetz-tab">${icon('grid')} Tonnetz</button><span class="separator"></span><span class="view-subtitle">THE HARMONIC LATTICE</span></div><div class="toolbar-right"><label class="sound-select"><span class="control-caption">VOICE</span><select id="voice" aria-label="Sound voice"><option value="soft">Soft electric</option><option value="piano">Sampled piano</option><option value="saw">Analog saw</option><option value="organ">Organ</option><option value="sine">Pure sine</option></select></label><span class="separator"></span><label class="volume-control"><span aria-hidden="true">${icon('sound')}</span><input id="volume" type="range" min="0" max="100" value="65" aria-label="Volume"></label></div></div>
<div class="lattice-panel"><div class="canvas-meta"><span id="tuning-meta"><i></i> C-BASED · 5-LIMIT</span><span id="audio-status">READY TO PLAY</span></div><svg id="lattice" viewBox="0 0 1100 480" aria-label="Playable Tonnetz lattice"></svg><div class="axis-legend" id="axis-legend"><span>↑ <b>3/2</b> fifth</span><span>↖ <b>5/4</b> major third</span><span>↗ <b>6/5</b> minor third</span></div><div class="canvas-tools"><button id="zoom-out" aria-label="Zoom out">−</button><button id="reset-view" aria-label="Reset lattice view" title="Reset view to C4 (R)" aria-keyshortcuts="R">↺</button><button id="zoom-in" aria-label="Zoom in">+</button></div><div class="note-inspector" id="inspector">Explore a note <span>to see its pure ratio</span></div></div>
<div class="settings-bar"><div class="tuning-selector" role="group" aria-label="Tuning system"><button id="tuning-ji" class="selected" aria-pressed="true" title="5-limit just intonation">JI</button><button id="tuning-tet" aria-pressed="false" title="12-tone equal temperament">12TET</button></div><div class="switch-group"><button id="sustain" class="switch on" role="switch" aria-checked="true"><span></span></button><label for="sustain">Sustain <kbd>SPACE</kbd></label></div><label class="release-control" title="Synthesized voices with sustain on. Piano uses its natural decay; pedal-off release is 100 ms.">Release <input id="release-length" type="range" min="0.1" max="12" step="0.1" value="5.5" aria-label="Release length" aria-describedby="release-hint"><output id="release-value" for="release-length">5.5 s</output></label><span id="release-hint" class="visually-hidden">Controls synthesized tails with sustain on. Piano samples use their natural decay. Pedal-off release stays at 100 milliseconds.</span><span class="separator"></span><label class="scale-control">Scale <select id="scale" aria-label="Scale"><option value="chromatic">Chromatic</option><option value="diatonic">Diatonic</option><option value="pentatonic">Pentatonic</option></select></label><span class="separator"></span><div class="switch-group"><button id="boundaries" class="switch" role="switch" aria-checked="false"><span></span></button><label for="boundaries">Octave borders</label></div><label class="labels-control">Labels <select id="labels" aria-label="Note labels"><option value="ratio">Note + octave + ratio</option><option value="octave" selected>Note + octave</option><option value="note">Note only</option><option value="none">Hidden</option></select></label></div>
</section>
<section class="keyboard-section" aria-label="Piano keyboard"><div class="keyboard-heading"><div><span class="eyebrow">THE KEYBOARD</span><span class="keyboard-caption">Same notes. Another perspective.</span></div><div class="keyboard-controls"><button id="octave-down" aria-label="Lower keyboard octave">←</button><span id="octave-range">C3 — C6</span><button id="octave-up" aria-label="Raise keyboard octave">→</button><button id="panic" class="text-button">Release all <span>↺</span></button></div></div><div id="keyboard" class="keyboard"></div><div class="keyboard-footer"><span><span class="key-dot held"></span> Playing <span class="key-dot sustained"></span> Sustaining <span class="key-dot resting"></span> At rest</span><span>Play with your mouse, touch, or <kbd>A</kbd>–<kbd>K</kbd> keys</span></div></section>
<footer><button id="reset-settings" class="text-button" title="Restore all settings and the view to defaults">Reset settings <span>↺</span></button><button id="tuning-info" class="text-button">Why just intonation? <span>↗</span></button><span>A4 = <b id="a4-frequency">436.04 Hz</b> <span class="footer-dot">·</span> C4 = 261.63 Hz</span></footer>
</main>
<dialog id="info-dialog"><button id="close-dialog" aria-label="Close dialog">×</button><div class="eyebrow">A MORE NATURAL CONNECTION</div><h2 id="dialog-title"></h2><div id="dialog-body"></div></dialog>`;
const instrument=new Instrument();
const notes=new Map<string,Note>();const elements=new Map<string,Element[]>();
const held=new Map<string,Set<string>>();const pointers=new Map<number,string>();
let tuning:Tuning=savedSettings.tuning;
let scale:Scale=savedSettings.scale;
let labelMode:Labels=savedSettings.labels;
let borders=savedSettings.borders,keyboardOctave=savedSettings.keyboardOctave,zoom=savedSettings.zoom,panX=savedSettings.panX,panY=savedSettings.panY;
instrument.timbre=savedSettings.voice;instrument.sustain=savedSettings.sustain;instrument.volume=savedSettings.volume;instrument.releaseLength=savedSettings.releaseLength;
function saveSettings(){writeSettings({tuning,scale,sustain:instrument.sustain,borders,labels:labelMode,voice:instrument.timbre,volume:instrument.volume,releaseLength:instrument.releaseLength,keyboardOctave,zoom,panX,panY});}
const svg=document.querySelector<SVGSVGElement>('#lattice')!;
const status=document.querySelector('#audio-status')!;
instrument.onStatus=message=>{status.textContent=message;};
function label(note:Note){return labelMode==='none'?'':note.name+((labelMode==='octave'||labelMode==='ratio')?note.octave:'');}
function register(note:Note,el:Element){notes.set(note.id,note);const list=elements.get(note.id)||[];list.push(el);elements.set(note.id,list);}
function drawLattice(){
  for(const id of [...elements.keys()])if(id.startsWith('l:')){elements.delete(id);}
  const radius=42*zoom;const height=Math.sqrt(3)*radius;
  let content='';
  for(let q=-15;q<=15;q++)for(let r=-12;r<=12;r++){
    const x=550+q*radius*1.5+panX,y=280+q*height/2-r*height+panY;
    if(x < -radius || x>1100+radius || y < -radius || y>480+radius)continue;
    const note=latticeNote(q,r,tuning);if(note.frequency<25||note.frequency>12000)continue;
    const gap=1.9;
    const vertices=Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return [x+(radius-gap)*Math.cos(a),y+(radius-gap)*Math.sin(a)];});
    const points=vertices.map(v=>v.join(',')).join(' ');
    const neighbors=[[1,0],[0,-1],[-1,-1],[-1,0],[0,1],[1,1]];
    const edges=borders?neighbors.map(([dq,dr],i)=>{
      if(latticeNote(q+dq,r+dr,tuning).octave===note.octave)return '';
      const [a,b]=[vertices[i],vertices[(i+1)%6]];
      return `<line class="octave-edge" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
    }).join(''):'';
    content+=`<g class="hex ${black.has(note.pc)?'accidental':''} ${!allowsPitch(note.pc,scale)?'disabled':''} ${q===0&&r===0?'root-note':''}" data-id="${note.id}" role="button" tabindex="${!allowsPitch(note.pc,scale)?-1:0}" aria-label="${note.name}${note.octave}, ${note.frequency.toFixed(2)} hertz" aria-disabled="${!allowsPitch(note.pc,scale)}"><title>${note.name}${note.octave} · ${note.ratioLabel} × C${note.octave} · ${note.frequency.toFixed(2)} Hz</title><polygon points="${points}"/>${edges}<text x="${x}" y="${y+(labelMode==='ratio'?-3:5)}" text-anchor="middle">${label(note)}${labelMode==='ratio'?`<tspan class="hex-ratio" x="${x}" dy="14" textLength="${Math.min(note.ratioLabel.length*4.6,radius*1.6)}" lengthAdjust="spacingAndGlyphs">${note.ratioLabel}</tspan>`:''}</text>${q===0&&r===0?`<circle class="root-dot" cx="${x}" cy="${y+(labelMode==='ratio'?23:18)}" r="2"/>`:''}</g>`;
  }
  svg.innerHTML=content;
  svg.querySelectorAll<SVGGElement>('[data-id]').forEach(el=>{const [q,r]=el.dataset.id!.slice(2).split(':').map(Number);register(latticeNote(q,r,tuning),el);});
}
function drawKeyboard(){
  for(const id of [...elements.keys()])if(id.startsWith('p:')){elements.delete(id);}
  const keyboard=document.querySelector<HTMLDivElement>('#keyboard')!;keyboard.innerHTML='';
  let whiteIndex=0;
  for(let n=0;n<=36;n++){
    const pc=n%12,octave=keyboardOctave+Math.floor(n/12),note=pianoNote(pc,octave,tuning);const isBlack=black.has(pc);
    const key=document.createElement('button');key.className=`piano-key ${isBlack?'black-key':'white-key'} ${!allowsPitch(pc,scale)?'disabled':''}`;
    key.dataset.id=note.id;key.disabled=!allowsPitch(pc,scale);key.setAttribute('aria-label',`${note.name}${octave}`);
    key.title=`${note.name}${octave} · ${note.ratioLabel} · ${note.frequency.toFixed(2)} Hz`;
    if(isBlack){key.style.left=`calc(${whiteIndex/22*100}% - 1.35%)`;}else{key.style.left=`${whiteIndex/22*100}%`;whiteIndex++;}
    key.innerHTML=`<span>${label(note)}${labelMode==='ratio'?`<small class="key-ratio">${note.ratioLabel}</small>`:''}</span>${pc===0?'<i></i>':''}`;keyboard.append(key);register(note,key);
  }
  document.querySelector('#octave-range')!.textContent=`C${keyboardOctave} — C${keyboardOctave+3}`;
}
async function press(id:string,owner:string){
  const note=notes.get(id);if(!note||(!allowsPitch(note.pc,scale)))return;
  let owners=held.get(id);const alreadyHeld=!!owners?.size;if(!owners){owners=new Set();held.set(id,owners);}owners.add(owner);
  if(alreadyHeld)return;
  const pressedOwners=owners;
  const pressedTuning=tuning;
  inspect(note);paint();
  try{await instrument.init();if(instrument.timbre==='piano')await instrument.loadPiano();
    if(tuning===pressedTuning&&held.get(id)===pressedOwners&&pressedOwners.size>0){instrument.attack(id,note.frequency);status.textContent='AUDIO ACTIVE';}
  }catch{if(held.get(id)===pressedOwners)held.delete(id);paint();}
}
function release(id:string,owner:string){const owners=held.get(id);owners?.delete(owner);if(owners&&!owners.size){held.delete(id);instrument.release(id);}}
function inspect(note:Note){document.querySelector('#inspector')!.innerHTML=`<strong>${note.name}<small>${note.octave}</small></strong><span>${note.ratioLabel} <i>·</i> ${note.frequency.toFixed(2)} Hz</span>`;}
function paint(){
  const sounding=[...instrument.voices.keys(),...held.keys()].map(id=>({note:notes.get(id),active:held.has(id),tail:instrument.tail(id)}));
  for(const [id,els]of elements){const note=notes.get(id)!;
    const matching=sounding.filter(s=>s.note&&Math.abs(s.note.frequency-note.frequency)<.01);
    const on=held.has(id)||matching.some(s=>s.active);const tail=Math.max(instrument.tail(id),...matching.map(s=>s.tail));
    for(const el of els){el.classList.toggle('playing',on);el.classList.toggle('sustaining',!on&&tail>.003);(el as HTMLElement).style.setProperty('--tail',`${tail}`);}
  }
}
function panic(){held.clear();pointers.clear();instrument.panic();paint();}
function noteAt(target:EventTarget|null){return target instanceof Element?target.closest<HTMLElement>('[data-id]')?.dataset.id:undefined;}
app.addEventListener('pointerdown',e=>{const id=noteAt(e.target);if(id){e.preventDefault();pointers.set(e.pointerId,id);void press(id,`pointer:${e.pointerId}`);}});
window.addEventListener('pointerup',e=>{const id=pointers.get(e.pointerId);if(id)release(id,`pointer:${e.pointerId}`);pointers.delete(e.pointerId);});
window.addEventListener('pointercancel',e=>{const id=pointers.get(e.pointerId);if(id)release(id,`pointer:${e.pointerId}`);pointers.delete(e.pointerId);});
app.addEventListener('pointermove',e=>{const id=noteAt(pointers.has(e.pointerId)?document.elementFromPoint(e.clientX,e.clientY):e.target);if(id)inspect(notes.get(id)!);if(pointers.has(e.pointerId)){const prev=pointers.get(e.pointerId)!;if(id!==prev){release(prev,`pointer:${e.pointerId}`);if(id){pointers.set(e.pointerId,id);void press(id,`pointer:${e.pointerId}`);}else pointers.set(e.pointerId,'');}}});
window.addEventListener('blur',panic);
const bindings:Record<string,number>={a:0,w:1,s:2,e:3,d:4,f:5,t:6,g:7,y:8,h:9,u:10,j:11,k:12,o:13,l:14};
function editable(e:KeyboardEvent){return (e.target instanceof Element&&!!e.target.closest('input,select,dialog'))||e.ctrlKey||e.metaKey||e.altKey;}
window.addEventListener('keydown',e=>{
  if(editable(e)||e.repeat)return;
  if(e.code==='Space'&&!noteAt(e.target)){e.preventDefault();document.querySelector<HTMLButtonElement>('#sustain')!.click();return;}
  if(e.key.toLowerCase()==='r'){e.preventDefault();resetView();return;}
  if(e.code==='Escape'){panic();return;}
  if((e.code==='Enter'||e.code==='Space')&&noteAt(e.target)){e.preventDefault();void press(noteAt(e.target)!,`focus:${e.code}`);return;}
  const n=bindings[e.key.toLowerCase()];if(n!==undefined){e.preventDefault();void press(`p:${keyboardOctave+1+Math.floor(n/12)}:${n%12}`,`key:${e.code}`);}
});
window.addEventListener('keyup',e=>{for(const [id,owners]of held)if(owners.has(`key:${e.code}`)||owners.has(`focus:${e.code}`)){release(id,`key:${e.code}`);release(id,`focus:${e.code}`);}});
function toggle(id:string,callback:(enabled:boolean)=>void){document.querySelector<HTMLButtonElement>(`#${id}`)!.addEventListener('click',e=>{const button=e.currentTarget as HTMLButtonElement;const enabled=button.getAttribute('aria-checked')!=='true';button.setAttribute('aria-checked',`${enabled}`);button.classList.toggle('on',enabled);callback(enabled);});}
toggle('sustain',enabled=>{instrument.setSustain(enabled);saveSettings();});
document.querySelector('#scale')!.addEventListener('change',e=>{panic();scale=(e.target as HTMLSelectElement).value as Scale;drawLattice();drawKeyboard();saveSettings();});
toggle('boundaries',enabled=>{borders=enabled;drawLattice();saveSettings();});
document.querySelector('#labels')!.addEventListener('change',e=>{labelMode=(e.target as HTMLSelectElement).value as Labels;drawLattice();drawKeyboard();saveSettings();});
document.querySelector('#voice')!.addEventListener('change',async e=>{panic();instrument.timbre=(e.target as HTMLSelectElement).value as Timbre;saveSettings();if(instrument.timbre==='piano'){try{await instrument.loadPiano();}catch{}}else status.textContent='READY TO PLAY';});
document.querySelector('#volume')!.addEventListener('input',e=>{instrument.setVolume(Number((e.target as HTMLInputElement).value)/100);saveSettings();});
document.querySelector('#release-length')!.addEventListener('input',e=>{instrument.releaseLength=Number((e.target as HTMLInputElement).value);updateReleaseLabel();saveSettings();});
function updateReleaseLabel(){document.querySelector('#release-value')!.textContent=`${instrument.releaseLength.toFixed(1)} s`;}
document.querySelector('#panic')!.addEventListener('click',panic);
for(const [id,delta]of [['octave-down',-1],['octave-up',1]] as const)document.querySelector(`#${id}`)!.addEventListener('click',()=>{panic();keyboardOctave=Math.max(1,Math.min(5,keyboardOctave+delta));drawKeyboard();saveSettings();});
for(const [id,delta]of [['zoom-out',-.15],['zoom-in',.15]] as const)document.querySelector(`#${id}`)!.addEventListener('click',()=>{zoom=Math.max(.65,Math.min(1.7,zoom+delta));drawLattice();saveSettings();});
function resetView(){zoom=1;panX=panY=0;drawLattice();inspect(latticeNote(0,0,tuning));saveSettings();}
document.querySelector('#reset-view')!.addEventListener('click',resetView);
function setTuning(next:Tuning){
  if(next===tuning)return;
  panic();tuning=next;notes.clear();drawLattice();drawKeyboard();
  renderTuning();saveSettings();
}
function renderTuning(){
  const isJI=tuning==='ji';
  for(const [id,selected]of [['tuning-ji',isJI],['tuning-tet',!isJI]] as const){
    const button=document.querySelector<HTMLButtonElement>(`#${id}`)!;
    button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',`${selected}`);
  }
  document.querySelector('#tuning-title')!.textContent=isJI?'5-limit tuning':'Equal temperament';
  document.querySelector('#tuning-subtitle')!.textContent=isJI?'Built on 2, 3 & 5':'12 equal semitones';
  document.querySelector('#tuning-meta')!.innerHTML=`<i></i> C-BASED · ${isJI?'5-LIMIT':'12TET'}`;
  document.querySelector('#a4-frequency')!.textContent=`${pianoNote(9,4,tuning).frequency.toFixed(2)} Hz`;
  document.querySelector('#axis-legend')!.innerHTML=isJI?'<span>↑ <b>3/2</b> fifth</span><span>↖ <b>5/4</b> major third</span><span>↗ <b>6/5</b> minor third</span>':'<span>↑ <b>700¢</b> fifth</span><span>↖ <b>400¢</b> major third</span><span>↗ <b>300¢</b> minor third</span>';
  inspect(latticeNote(0,0,tuning));
}
document.querySelector('#tuning-ji')!.addEventListener('click',()=>setTuning('ji'));
document.querySelector('#tuning-tet')!.addEventListener('click',()=>setTuning('12tet'));
svg.addEventListener('wheel',e=>{e.preventDefault();panX-=e.deltaX;panY-=e.deltaY;panX=Math.max(-450,Math.min(450,panX));panY=Math.max(-350,Math.min(350,panY));drawLattice();saveSettings();},{passive:false});
const dialog=document.querySelector<HTMLDialogElement>('#info-dialog')!;
function showInfo(title:string,body:string){document.querySelector('#dialog-title')!.textContent=title;document.querySelector('#dialog-body')!.innerHTML=body;dialog.showModal();}
document.querySelector('#close-dialog')!.addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
document.querySelector('#help')!.addEventListener('click',()=>showInfo('Follow your ear.',`<p>Press and hold a hexagon or piano key. Release it to let the note fade. Drag across notes for a glissando; use multiple fingers for chords.</p><p>On your computer, <b>A S D F G H J K</b> play the white keys from C4 (or the middle keyboard octave), and <b>W E T Y U</b> play the accidentals. Space toggles sustain. Escape releases all notes.</p><p>Scroll the lattice to explore farther notes. Use + and − to zoom, and ↺ or press <b>R</b> to return to C4. Switch between <b>JI</b> and <b>12TET</b> to compare pure ratios with equal semitones. Changing tuning releases sounding notes. Turn on octave borders to see where pitch registers change.</p><p>Choose a voice, hide the labels, or choose Chromatic, C major Diatonic, or C major Pentatonic (C, D, E, G, A). Release sets the synthesized tail length with sustain on; piano keeps its natural decay, and pedal-off release stays at 100 ms. Your settings and view are saved on this browser. Reset settings restores the defaults. The blue glow follows each released voice’s decay.</p>`));
document.querySelector('#tuning-info')!.addEventListener('click',()=>showInfo('Harmony in whole numbers.',`<p>Just intonation tunes intervals with simple frequency ratios. A fifth is <b>3/2</b>, a major third is <b>5/4</b>, and a minor third is <b>6/5</b>. Five-limit tuning uses only powers of the primes 2, 3, and 5.</p><p>This lattice follows your reference: upward is a fifth, upper-left a major third, and upper-right a minor third, allowing octave shifts. Every cell is calculated from its lattice coordinates. The pictured neighborhood shares octave 4; rows beyond it extend to other octaves.</p><p>Pure intervals cannot close into a repeating twelve-note grid. Farther cells may share a name but differ by a small comma. The piano uses the twelve ratios in the central reference patch, including C♯ = 25/24 and G♯ = 25/16. Matching pitches light up together.</p><p>C4 is fixed at 261.6256 Hz, giving a pure A4 of 436.0426 Hz. In 12TET, C4 stays fixed, every semitone has ratio 2^(1/12), and A4 is 440 Hz. Piano samples are repitched to the selected tuning.</p><p><a href="https://en.wikipedia.org/wiki/Five-limit_tuning" target="_blank" rel="noreferrer">Read about five-limit tuning ↗</a></p>`));
function syncControls(){
  for(const [id,value]of [['scale',scale],['labels',labelMode],['voice',instrument.timbre],['volume',String(instrument.volume*100)],['release-length',String(instrument.releaseLength)]])document.querySelector<HTMLInputElement|HTMLSelectElement>(`#${id}`)!.value=value;
  for(const [id,enabled]of [['sustain',instrument.sustain],['boundaries',borders]] as const){
    const button=document.querySelector<HTMLButtonElement>(`#${id}`)!;
    button.setAttribute('aria-checked',String(enabled));button.classList.toggle('on',enabled);
  }
  renderTuning();updateReleaseLabel();
}
document.querySelector('#reset-settings')!.addEventListener('click',()=>{
  panic();tuning=defaults.tuning;scale=defaults.scale;labelMode=defaults.labels;borders=defaults.borders;
  keyboardOctave=defaults.keyboardOctave;zoom=defaults.zoom;panX=defaults.panX;panY=defaults.panY;
  instrument.timbre=defaults.voice;instrument.setSustain(defaults.sustain);instrument.setVolume(defaults.volume);instrument.releaseLength=defaults.releaseLength;
  notes.clear();drawLattice();drawKeyboard();syncControls();saveSettings();status.textContent='DEFAULT SETTINGS RESTORED';
});
drawLattice();drawKeyboard();syncControls();
let last=0;function frame(time:number){if(time-last>40){instrument.cleanup();paint();last=time;}requestAnimationFrame(frame);}requestAnimationFrame(frame);
