import { FIELD as F } from './config.js';
// Shared samples keep visible corner quarter-pipes and collision surfaces identical.
export function cornerRamp(sx,sz){
  const vertices=[],indices=[],segments=16,rows=12;
  for(let row=0;row<=rows;row++)for(let col=0;col<=segments;col++){
    const a=row/rows*Math.PI/2,b=col/segments*Math.PI/2,r=F.corner-F.ramp+F.ramp*Math.sin(a);
    vertices.push(sx*(F.x-F.corner+r*Math.cos(b)),F.ramp*(1-Math.cos(a)),sz*(F.z-F.corner+r*Math.sin(b)));
  }
  for(let row=0;row<rows;row++)for(let col=0;col<segments;col++){const i=row*(segments+1)+col,j=i+segments+1;indices.push(i,j,i+1,i+1,j,j+1);}
  return {vertices:new Float32Array(vertices),indices:new Uint32Array(indices)};
}
