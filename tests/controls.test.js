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
