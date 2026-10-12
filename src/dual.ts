export type Coordinate = readonly [number,number];
// Each edge is emitted once. Both faces have the lower note as their root.
export const dualEdges = [
  {delta:[0,1] as Coordinate, name:'Fifth'},
  {delta:[-1,0] as Coordinate, name:'Major third'},
  {delta:[1,1] as Coordinate, name:'Minor third'},
];
export function dualFaces(q:number,r:number) {
  return [
    {quality:'major' as const,vertices:[[q,r],[q-1,r],[q,r+1]] as Coordinate[]},
    {quality:'minor' as const,vertices:[[q,r],[q+1,r+1],[q,r+1]] as Coordinate[]},
  ];
}
