export const C4 = 261.6255653005986;
export const names = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'B♭', 'B'];
// The reference patch, derived from the lattice rather than an ET approximation.
export const ratios = [1, 25/24, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 25/16, 5/3, 9/5, 15/8];
export const black = new Set([1, 3, 6, 8, 10]);
export type Tuning = 'ji' | '12tet';
export interface Note { id:string; name:string; octave:number; frequency:number; ratio:number; pc:number; ratioLabel:string; q?:number; r?:number }
export function latticeNote(q:number, r:number, tuning:Tuning='ji'): Note {
  const raw = (4/5)**q * (3/2)**r;
  const semitones = -4*q+7*r;
  const fold = Math.floor(semitones/12);
  const pc = ((semitones % 12)+12)%12;
  const ratio = tuning==='12tet' ? 2**(pc/12) : raw / 2**fold;
  let numerator=1n, denominator=1n;
  for(const [prime, exponent] of [[2,2*q-r-fold],[3,r],[5,-q]]) {
    if(exponent>=0) numerator*=BigInt(prime)**BigInt(exponent);
    else denominator*=BigInt(prime)**BigInt(-exponent);
  }
  const ratioLabel=tuning==='12tet' ? (pc===0?'1/1':`2^(${pc}/12)`) : `${numerator}/${denominator}`;
  // A spatial octave lift keeps the pictured twelve-note neighborhood in octave 4.
  // All lattice intervals remain exact modulo powers of two.
  const octave = 4 + Math.floor((r+1)/4);
  return { id:`l:${q}:${r}`, name:names[pc], octave, frequency:C4*ratio*2**(octave-4), ratio, ratioLabel, pc, q, r };
}
export function pianoNote(pc:number, octave:number, tuning:Tuning='ji'): Note {
  const ratio=tuning==='12tet' ? 2**(pc/12) : ratios[pc];
  const ratioLabel=tuning==='12tet' ? (pc===0?'1/1':`2^(${pc}/12)`) : ['1/1','25/24','9/8','6/5','5/4','4/3','45/32','3/2','25/16','5/3','9/5','15/8'][pc];
  return {id:`p:${octave}:${pc}`, name:names[pc], octave, pc, ratio, ratioLabel, frequency:C4*ratio*2**(octave-4)};
}
