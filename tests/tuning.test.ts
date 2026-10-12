import {test} from 'node:test';
import assert from 'node:assert/strict';
import {latticeNote,pianoNote,ratios} from '../src/tuning.ts';
const moduloOctave=(x:number)=>x/2**Math.floor(Math.log2(x));
test('central patch follows the supplied twelve-note geometry',()=>{
 const coordinates=[[0,0],[-2,-1],[0,2],[1,1],[-1,0],[0,-1],[-1,2],[0,1],[-2,0],[-1,-1],[1,2],[-1,1]];
 coordinates.forEach(([q,r],pc)=>{const n=latticeNote(q,r);assert.equal(n.pc,pc);assert.equal(n.octave,4);assert.ok(Math.abs(n.ratio-ratios[pc])<1e-12);assert.ok(Math.abs(n.frequency-pianoNote(pc,4).frequency)<1e-9);});
});
test('all three lattice axes stay pure across octave boundaries',()=>{
 for(let q=-8;q<=8;q++)for(let r=-8;r<=8;r++){
 const f=latticeNote(q,r).frequency;
 for(const [dq,dr,ratio]of [[0,1,3/2],[-1,0,5/4],[1,1,6/5]])assert.ok(Math.abs(moduloOctave(latticeNote(q+dq,r+dr).frequency/f)-ratio)<1e-10);
 }
});
test('piano frequencies double with each octave',()=>{for(let pc=0;pc<12;pc++)assert.equal(pianoNote(pc,5).frequency/pianoNote(pc,4).frequency,2);});
test('12TET has equal semitones, fixed C4, and A4 at 440 Hz',()=>{
 for(let pc=0;pc<12;pc++) {
  const note=pianoNote(pc,4,'12tet');
  assert.ok(Math.abs(note.frequency-440*2**((pc-9)/12))<1e-9);
  const next=pianoNote((pc+1)%12,pc===11?5:4,'12tet');
  assert.ok(Math.abs(next.frequency/note.frequency-2**(1/12))<1e-12);
 }
 assert.equal(pianoNote(0,4,'12tet').frequency,pianoNote(0,4,'ji').frequency);
});
test('12TET lattice agrees with the piano and has tempered axes',()=>{
 for(let q=-8;q<=8;q++)for(let r=-8;r<=8;r++) {
  const note=latticeNote(q,r,'12tet');
  assert.equal(note.frequency,pianoNote(note.pc,note.octave,'12tet').frequency);
  for(const [dq,dr,semitones]of [[0,1,7],[-1,0,4],[1,1,3]]) {
   const interval=latticeNote(q+dq,r+dr,'12tet').frequency/note.frequency;
   assert.ok(Math.abs(moduloOctave(interval)-2**(semitones/12))<1e-12);
  }
 }
});
test('unfolded upward walk uses ascending fifths and natural note octaves',()=>{
 const expected=[['C',4],['G',4],['D',5],['A',5],['E',6]];
 expected.forEach(([name,octave],r)=>{const note=latticeNote(0,r,'ji',true);assert.equal(note.name,name);assert.equal(note.octave,octave);assert.ok(Math.abs(note.frequency/latticeNote(0,0,'ji',true).frequency-(3/2)**r)<1e-10);});
});
test('all unfolded axes ascend by exact intervals without octave reduction',()=>{
 for(let q=-6;q<=6;q++)for(let r=-6;r<=6;r++)for(const [dq,dr,ratio,semitones]of [[0,1,3/2,7],[-1,0,5/4,4],[1,1,6/5,3]]){
  const a=latticeNote(q,r,'ji',true),b=latticeNote(q+dq,r+dr,'ji',true);
  assert.ok(Math.abs(b.frequency/a.frequency-ratio)<1e-10);
  const etA=latticeNote(q,r,'12tet',true),etB=latticeNote(q+dq,r+dr,'12tet',true);
  assert.ok(Math.abs(etB.frequency/etA.frequency-2**(semitones/12))<1e-10);
 }
});
