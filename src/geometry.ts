export function latticePosition(q:number,r:number,radius:number,rotation:number,panX=0,panY=0){
  const x=q*radius*1.5,y=q*Math.sqrt(3)*radius/2-r*Math.sqrt(3)*radius;
  const angle=rotation*Math.PI/180;
  return {x:550+x*Math.cos(angle)-y*Math.sin(angle)+panX,y:280+x*Math.sin(angle)+y*Math.cos(angle)+panY};
}
export function rotateBy(rotation:number,delta:number){return ((rotation+delta)%360+360)%360;}
