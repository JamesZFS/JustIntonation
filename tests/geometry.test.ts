import {test} from 'node:test';
import assert from 'node:assert/strict';
import {latticePosition,rotateBy} from '../src/geometry.ts';
test('rotation anchors C4 and preserves neighbor distances',()=>{
  for(let rotation=0;rotation<360;rotation+=30){
    const root=latticePosition(0,0,42,rotation,10,-20);
    assert.deepEqual(root,{x:560,y:260});
    for(const [q,r]of [[0,1],[-1,0],[1,1]]){
      const note=latticePosition(q,r,42,rotation,10,-20);
      assert.ok(Math.abs(Math.hypot(note.x-root.x,note.y-root.y)-42*Math.sqrt(3))<1e-10);
    }
  }
});
test('left and right rotation wrap in 30-degree steps',()=>{
  assert.equal(rotateBy(0,-30),330);
  assert.equal(rotateBy(330,30),0);
  assert.equal(rotateBy(rotateBy(120,-30),30),120);
});
