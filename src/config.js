export const FIELD = { x: 81.92, z: 102.4, height: 40.88, goalWidth: 35.72, goalHeight: 12.84, goalDepth: 17.6, ramp: 5.12, corner: 11.5 };
export const BALL_RADIUS = 1.825;
export const STEP = 1 / 120;
export const CAR = { mass: 180, maxSpeed: 46, driveSpeed: 28.2, boostAcceleration: 19.83, boostDrain: 33.3, jumpSpeed: 5.84, doubleWindow: 1.25 };
export const BLUE = 0x168aff, ORANGE = 0xff9c27;
export const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
export const PAD_POSITIONS = [
  ...[-1,1].flatMap(x=>[-1,1].map(z=>({x:x*61.44,z:z*81.92,large:true}))),
  ...[-1,1].map(x=>({x:x*71.68,z:0,large:true})),
  ...[-1,1].flatMap(s=>[[0,84.48],[-35.84,83.2],[35.84,83.2],[-18.8,66.56],[18.8,66.56],[0,56.32],[-40.96,51.2],[40.96,51.2],[-71.68,49.92],[71.68,49.92],[-18.8,20.48],[18.8,20.48],[0,20.48]].map(([x,z])=>({x,z:z*s,large:false}))),
  {x:-20.48,z:0,large:false},{x:20.48,z:0,large:false}
];
