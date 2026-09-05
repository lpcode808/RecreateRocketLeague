import test from 'node:test';
import assert from 'node:assert/strict';
import { Controls } from '../src/controls.js';

test('pause-menu Tab and Space retain browser defaults while gameplay jump stays buffered',()=>{
  const listeners=new Map();
  globalThis.window={addEventListener:(name,fn)=>listeners.set(name,fn)};
  try{
    const controls=new Controls(()=>{});
    const key=(code,menu=false)=>{
      const event={code,repeat:false,target:{tagName:menu?'BUTTON':'CANVAS',closest:()=>menu},prevented:false,preventDefault(){this.prevented=true;}};
      listeners.get('keydown')(event);return event;
    };
    assert.equal(key('Tab',true).prevented,false);
    assert.equal(key('Space',true).prevented,false);
    assert.equal(controls.read().jump,false);
    assert.equal(key('Space').prevented,true);
    assert.equal(controls.read().jump,true);
    assert.equal(controls.read().jump,false);
    assert.equal(controls.read().jumpHeld,true);
    listeners.get('blur')();assert.equal(controls.read().jumpHeld,false);
  }finally{delete globalThis.window;}
});

test('touch axes combine with keyboard; jump edges survive release and clear removes all held inputs',()=>{
  globalThis.window={addEventListener:()=>{}};
  try{
    const controls=new Controls(()=>{});
    controls.setTouch({throttle:.6,steer:-.5,boost:true,jumpHeld:true});
    let input=controls.read();assert.equal(input.throttle,.6);assert.equal(input.steer,-.5);assert.equal(input.boost,true);assert.equal(input.jump,true);
    assert.equal(controls.read().jump,false);
    controls.setTouch({jumpHeld:false});controls.setTouch({jumpHeld:true});controls.setTouch({jumpHeld:false});
    assert.equal(controls.read().jump,true);assert.equal(controls.read().jumpHeld,false);
    controls.keys.add('KeyW');assert.equal(controls.read().throttle,1);
    controls.clearTouch();assert.equal(controls.read().throttle,1);assert.equal(controls.read().boost,false);
    controls.setTouch({roll:1,drift:true,jumpHeld:true});controls.clear();
    assert.deepEqual(controls.read(),{throttle:0,steer:0,roll:0,boost:false,drift:false,jump:false,jumpHeld:false});
  }finally{delete globalThis.window;}
});
