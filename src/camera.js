import { FIELD, clamp } from './config.js';

export const CAMERA_CLEARANCE={horizontal:1.4,vertical:1.2,ground:1.5};

export function smoothHeading(current,target,amount){
  const from=Math.atan2(current.z,current.x),to=Math.atan2(target.z,target.x);
  const delta=Math.atan2(Math.sin(to-from),Math.cos(to-from)),angle=from+delta*amount;
  return {x:Math.cos(angle),z:Math.sin(angle)};
}

// Keep the camera inside the same top-down outline as the arena collision:
// straight walls, circular corner walls, and the recessed goal volume.
export function containCamera(point,field=FIELD,clearance=CAMERA_CLEARANCE){
  const p={x:point.x,y:point.y,z:point.z};
  const side=clearance.horizontal,fieldEnd=field.z-side,goalEnd=field.z+field.goalDepth-side;
  const goalHalf=Math.max(0,field.goalWidth/2-side);
  let inGoal=false;
  if(Math.abs(p.z)>fieldEnd){
    // An aerial view belongs on the field side of the goal roof. Letting it
    // enter the tunnel would clamp it down to the goal ceiling mid-flight.
    if(Math.abs(p.x)<=goalHalf&&p.y<=field.goalHeight-clearance.vertical){
      p.x=clamp(p.x,-goalHalf,goalHalf);p.z=Math.sign(p.z||1)*Math.min(Math.abs(p.z),goalEnd);inGoal=true;
    }else p.z=Math.sign(p.z||1)*fieldEnd;
  }
  // The side/end straight walls meet an inward quarter-circle, not a square.
  const cornerX=field.x-field.corner,cornerZ=field.z-field.corner;
  if(Math.abs(p.x)>cornerX&&Math.abs(p.z)>cornerZ){
    const sx=Math.sign(p.x||1),sz=Math.sign(p.z||1),dx=p.x-sx*cornerX,dz=p.z-sz*cornerZ;
    const radius=Math.max(0,field.corner-side),distance=Math.hypot(dx,dz);
    if(distance>radius){p.x=sx*cornerX+dx/distance*radius;p.z=sz*cornerZ+dz/distance*radius;}
  }
  p.x=clamp(p.x,-field.x+side,field.x-side);
  p.y=clamp(p.y,clearance.ground,(inGoal?field.goalHeight:field.height)-clearance.vertical);
  return p;
}
