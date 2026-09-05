import test from 'node:test';
import assert from 'node:assert/strict';
import { stickAxes } from '../src/touch.js';
test('stick has a dead zone, analog travel, and bounded diagonal input',()=>{
  assert.deepEqual(stickAxes(0,0,50),{steer:0,throttle:0});
  assert.equal(stickAxes(3,0,50).steer,0);
  assert.ok(stickAxes(25,0,50).steer>0&&stickAxes(25,0,50).steer<1);
  assert.equal(stickAxes(0,-100,50).throttle,1);
  assert.equal(stickAxes(0,100,50).throttle,-1);
  const diagonal=stickAxes(100,-100,50);
  assert.ok(Math.abs(Math.hypot(diagonal.steer,diagonal.throttle)-1)<1e-10);
});
