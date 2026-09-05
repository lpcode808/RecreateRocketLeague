import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { Match, goalForBall } from '../src/match.js';
import { Physics } from '../src/physics.js';
import { FIELD, BALL_RADIUS, STEP, PAD_POSITIONS } from '../src/config.js';
const neutral={throttle:0,steer:0,roll:0,jump:false,jumpHeld:false,boost:false};
const physics=await new Physics().init();
const advance=(seconds,input={})=>{for(let i=0;i<Math.round(seconds/STEP);i++)physics.step([{...neutral,...input},neutral],STEP,false);};

test('only a fully crossed ball inside the goal mouth scores',()=>{
 assert.equal(goalForBall({x:0,y:2,z:-FIELD.z-BALL_RADIUS+.01}),null);
 assert.equal(goalForBall({x:0,y:2,z:-FIELD.z-BALL_RADIUS-.01}),0);
 assert.equal(goalForBall({x:0,y:2,z:FIELD.z+BALL_RADIUS+.01}),1);
 assert.equal(goalForBall({x:FIELD.goalWidth/2,y:2,z:-110}),null);
 assert.equal(goalForBall({x:0,y:FIELD.goalHeight,z:-110}),null);
});
test('goal scores once, freezes clock, resets, then counts down',()=>{
 const m=new Match();m.phase='playing';m.time=100;
 assert.equal(m.tick(STEP,{x:0,y:2,z:-110}),'goal');
 for(let i=0;i<100;i++)m.tick(STEP,{x:0,y:2,z:-110});
 assert.deepEqual(m.score,[1,0]);assert.equal(m.time,100);
 assert.equal(m.tick(4,{x:0,y:2,z:0}),'reset');assert.equal(m.phase,'kickoff');
 assert.equal(m.tick(3.1,{x:0,y:2,z:0}),'go');
});
test('zero clock waits for the ball to land, ties enter sudden death',()=>{
 const m=new Match();m.phase='playing';m.time=.001;
 m.tick(STEP,{x:0,y:5,z:0});assert.equal(m.phase,'playing');
 assert.equal(m.tick(STEP,{x:0,y:BALL_RADIUS,z:0}),'reset');assert.equal(m.overtime,true);
 m.phase='playing';assert.equal(m.tick(STEP,{x:0,y:2,z:110}),'goal');assert.equal(m.winner,1);assert.equal(m.phase,'finished');
});
test('34 boost pads include exactly six full refills',()=>{assert.equal(PAD_POSITIONS.length,34);assert.equal(PAD_POSITIONS.filter(p=>p.large).length,6);});
test('suspension settles; throttle, steering and boost produce controlled motion',()=>{
 physics.reset();advance(1);const c=physics.cars[0];assert.ok(c.grounded);assert.ok(Math.abs(c.body.translation().z-65)<.1);
 advance(2,{throttle:1});assert.ok(c.body.translation().z<35);assert.ok(c.speed>23&&c.speed<30);
 advance(.6,{throttle:1,steer:1});assert.ok(c.body.translation().x>3);
 c.boost=100;advance(1,{boost:true});assert.ok(c.speed>35);assert.ok(c.boost<68&&c.boost>66);
});
test('jump, held height, and directional second-jump flip',()=>{
 physics.reset();advance(.6);const c=physics.cars[0];advance(STEP,{jump:true});advance(.15,{jumpHeld:true});assert.ok(c.body.translation().y>1.4);assert.equal(c.jumpCount,1);
 advance(STEP,{jump:true,throttle:1});assert.equal(c.jumpCount,2);assert.ok(c.flipTime>0);
 advance(.7);assert.ok(c.flipTime<=0);assert.ok(c.body.linvel().z< -8);
});
test('ball receives a real car impact and rebounds off a side wall',()=>{
 physics.reset();const c=physics.cars[0];c.body.setTranslation({x:0,y:.5,z:6},true);advance(.5,{throttle:1,boost:true});assert.ok(physics.ball.linvel().z< -3);
 physics.ball.setTranslation({x:78,y:10,z:0},true);physics.ball.setLinvel({x:20,y:0,z:0},true);advance(.3);assert.ok(physics.ball.linvel().x<0);assert.ok(physics.ball.translation().x<FIELD.x);
});
test('curved ramp transitions the car onto a vertical wall',()=>{
 physics.reset();const c=physics.cars[0];c.boost=100;c.body.setTranslation({x:72,y:.5,z:0},true);c.body.setRotation({x:0,y:-Math.SQRT1_2,z:0,w:Math.SQRT1_2},true);c.body.setLinvel({x:25,y:0,z:0},true);advance(1.5,{throttle:1,boost:true});assert.ok(c.body.translation().y>15);assert.ok(c.grounded);assert.ok(c.body.translation().x<FIELD.x);
});
test('omitted optional input fields never poison the physics world',()=>{
 physics.reset();for(let i=0;i<120;i++)physics.step([{},{}],STEP,false);for(const c of physics.cars)for(const v of Object.values(c.body.translation()))assert.ok(Number.isFinite(v));
});
test('four wheel contacts on the ball restore an aerial flip',()=>{
 physics.reset();const c=physics.cars[0],before=c.flipResets;
 c.body.setTranslation({x:0,y:8,z:0},true);c.body.setRotation({x:0,y:0,z:1,w:0},true);c.jumpCount=2;c.jumpAge=1;
 physics.ball.setTranslation({x:0,y:10.15,z:0},true);advance(.04);
 assert.equal(c.flipResets,before+1);assert.equal(c.jumpCount,0);
 advance(STEP,{jump:true,throttle:1});assert.equal(c.jumpCount,2);assert.ok(c.flipTime>0);
});
test('a roof-down car can use jump to right itself',()=>{
 physics.reset();const c=physics.cars[0];c.body.setTranslation({x:30,y:.5,z:30},true);c.body.setRotation({x:0,y:0,z:1,w:0},true);advance(.6);c.flipInput={throttle:1,steer:1};advance(STEP,{jump:true});assert.equal(c.flipInput,null);advance(.65);
 const q=c.body.rotation();const upY=1-2*(q.x*q.x+q.z*q.z);assert.ok(upY>.7);
});
test('boost does not force aerial pitch or turn a neutral double jump into a flip',()=>{
 physics.reset();advance(.6);const c=physics.cars[0];c.boost=100;
 advance(STEP,{jump:true});advance(.25,{boost:true});const q=c.body.rotation();assert.ok(Math.abs(q.x)<.08);
 advance(STEP,{jump:true,boost:true});assert.equal(c.jumpCount,2);assert.ok(c.flipTime<=0);assert.ok(c.body.linvel().y>4);
});
test('opposite pitch cancels only the pitch part of a diagonal flip',()=>{
 physics.reset();advance(.6);const c=physics.cars[0];
 advance(STEP,{jump:true});advance(.12,{jumpHeld:true});advance(STEP,{jump:true,throttle:1,steer:1});
 assert.ok(c.flipTime>.5);advance(STEP,{throttle:-1});
 const q=new T.Quaternion().copy(c.body.rotation()),right=new T.Vector3(1,0,0).applyQuaternion(q),forward=new T.Vector3(0,0,-1).applyQuaternion(q),angular=new T.Vector3(c.body.angvel().x,c.body.angvel().y,c.body.angvel().z);
 assert.ok(Math.abs(angular.dot(right))<.1);assert.ok(Math.abs(angular.dot(forward))>6);assert.ok(c.flipTime>.5);
});
test('every kickoff, including overtime, gives a GO cue',()=>{
 const m=new Match();m.phase='kickoff';m.phaseTime=.001;m.time=120;
 assert.equal(m.tick(STEP,{x:0,y:2,z:0}),'go');assert.ok(m.goTime>.5);
 m.tick(1,{x:0,y:2,z:0});assert.equal(m.goTime,0);
});
