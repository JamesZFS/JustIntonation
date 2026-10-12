import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dualEdges,dualFaces} from '../src/dual.ts';
import {latticeNote} from '../src/tuning.ts';
const fold=(ratio:number)=>ratio/2**Math.floor(Math.log2(ratio));
test('dual triangles contain pure major and minor triads throughout the lattice',()=>{
  for(let q=-6;q<=6;q++)for(let r=-6;r<=6;r++)for(const face of dualFaces(q,r)){
    const notes=face.vertices.map(([q,r])=>latticeNote(q,r));
    const intervals=notes.map(note=>fold(note.frequency/notes[0].frequency));
    assert.ok(Math.abs(intervals[1]-(face.quality==='major'?5/4:6/5))<1e-10);
    assert.ok(Math.abs(intervals[2]-3/2)<1e-10);
    assert.equal(new Set(notes.map(note=>note.id)).size,3);
  }
});
test('each dual edge represents one of the three original axes',()=>{
  const root=latticeNote(0,0);
  const intervals=dualEdges.map(({delta:[q,r]})=>fold(latticeNote(q,r).frequency/root.frequency));
  [3/2,5/4,6/5].forEach((ratio,i)=>assert.ok(Math.abs(intervals[i]-ratio)<1e-12));
});
