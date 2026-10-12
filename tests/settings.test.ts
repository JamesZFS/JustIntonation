import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allowsPitch,defaults,validateSettings} from '../src/settings.ts';
test('scale membership gates the intended pitch classes',()=>{
  const pitches=Array.from({length:12},(_,i)=>i);
  assert.deepEqual(pitches.filter(pc=>allowsPitch(pc,'chromatic')),pitches);
  assert.deepEqual(pitches.filter(pc=>allowsPitch(pc,'diatonic')),[0,2,4,5,7,9,11]);
  assert.deepEqual(pitches.filter(pc=>allowsPitch(pc,'pentatonic')),[0,2,4,7,9]);
});
test('valid stored settings survive a JSON round trip',()=>{
  const settings={view:'dual',unfolded:true,tuning:'12tet',scale:'pentatonic',sustain:false,borders:true,labels:'ratio',voice:'organ',volume:.35,releaseLength:2.3,keyboardOctave:4,zoom:1.3,panX:100,panY:-60};
  assert.deepEqual(validateSettings(JSON.parse(JSON.stringify(settings))),settings);
});
test('invalid stored settings fall back safely while preserving valid fields',()=>{
  assert.deepEqual(validateSettings(null),defaults);
  assert.deepEqual(validateSettings({tuning:'unknown',scale:'minor',sustain:'false',borders:true,labels:'invalid',voice:'invalid',volume:Infinity,releaseLength:-1,keyboardOctave:2.5,zoom:20,panX:NaN,panY:900}),{...defaults,borders:true});
});
