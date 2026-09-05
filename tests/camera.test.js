import test from 'node:test';
import assert from 'node:assert/strict';
import { FIELD } from '../src/config.js';
import { CAMERA_CLEARANCE, containCamera, smoothHeading } from '../src/camera.js';

const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);

test('camera containment follows the rounded corner wall instead of the rectangular field bounds',()=>{
 const p=containCamera({x:FIELD.x+20,y:8,z:FIELD.z+20});
 const cx=FIELD.x-FIELD.corner,cz=FIELD.z-FIELD.corner;
 close(Math.hypot(p.x-cx,p.z-cz),FIELD.corner-CAMERA_CLEARANCE.horizontal);
 assert.ok(p.x<FIELD.x-CAMERA_CLEARANCE.horizontal);
 assert.ok(p.z<FIELD.z-CAMERA_CLEARANCE.horizontal);
});

test('camera enters the goal only below its roof and keeps aerial views on the field side',()=>{
 const inside=containCamera({x:0,y:27,z:-105});
 close(inside.z,-FIELD.z+CAMERA_CLEARANCE.horizontal);
 close(inside.y,27);
 const tunnel=containCamera({x:0,y:6,z:FIELD.z+FIELD.goalDepth+5});
 close(tunnel.z,FIELD.z+FIELD.goalDepth-CAMERA_CLEARANCE.horizontal);
 const outside=containCamera({x:FIELD.goalWidth/2,y:6,z:FIELD.z+4});
 close(outside.z,FIELD.z-CAMERA_CLEARANCE.horizontal);
});

test('already safe camera positions remain unchanged',()=>{
 const point={x:12,y:7,z:-44};
 assert.deepEqual(containCamera(point),point);
});

test('containment repairs an out-of-bounds smoothed frame as well as a target',()=>{
 const stale={x:FIELD.x+20,y:8,z:FIELD.z+20},target={x:0,y:8,z:0};
 const smoothed={x:stale.x*.9+target.x*.1,y:8,z:stale.z*.9+target.z*.1};
 const p=containCamera(smoothed),cx=FIELD.x-FIELD.corner,cz=FIELD.z-FIELD.corner;
 assert.ok(Math.hypot(p.x-cx,p.z-cz)<=FIELD.corner-CAMERA_CLEARANCE.horizontal+1e-9);
});

test('wrapped heading smoothing turns through an exact 180-degree yaw',()=>{
 let heading={x:0,z:-1};
 for(let i=0;i<20;i++)heading=smoothHeading(heading,{x:0,z:1},.2);
 assert.ok(heading.z>.98);
});
