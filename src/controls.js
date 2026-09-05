export class Controls {
  constructor(onAction) {
    this.keys = new Set(); this.jump = false;
    this.touch={throttle:0,steer:0,roll:0,boost:false,drift:false,jumpHeld:false};
    window.addEventListener('keydown',e=>{
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)&&e.code!=='Escape') return;
      if(e.target.closest('#pause-overlay')&&['Space','Enter','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))return;
      // Tab belongs to the browser so the pause dialog can cycle through its controls.
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
      if (!e.repeat) {
        if(e.code==='Space') this.jump=true;
        const actions={KeyR:'reset',KeyC:'camera',KeyB:'infinite',Escape:'pause',KeyP:'pause',KeyH:'help',KeyM:'mute'};
        if(actions[e.code]) onAction(actions[e.code]);
      }
      this.keys.add(e.code);
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    window.addEventListener('blur',()=>{this.clear();onAction('blur');});
  }
  clear(){this.keys.clear();this.jump=false;this.clearTouch();this.onClear?.();}
  clearTouch(){this.touch={throttle:0,steer:0,roll:0,boost:false,drift:false,jumpHeld:false};this.jump=false;}
  setTouch(values){if(values.jumpHeld&&!this.touch.jumpHeld)this.jump=true;Object.assign(this.touch,values);}
  read(){
    const k=(...codes)=>codes.some(c=>this.keys.has(c));
    const input={throttle:Number(k('KeyW','ArrowUp'))-Number(k('KeyS','ArrowDown')),steer:Number(k('KeyD','ArrowRight'))-Number(k('KeyA','ArrowLeft')),roll:Number(k('KeyE'))-Number(k('KeyQ')),boost:k('ShiftLeft','ShiftRight'),drift:k('ControlLeft','ControlRight'),jump:this.jump,jumpHeld:k('Space')};
    for(const axis of ['throttle','steer','roll'])input[axis]=Math.max(-1,Math.min(1,input[axis]+this.touch[axis]));
    for(const button of ['boost','drift','jumpHeld'])input[button] ||= this.touch[button];
    this.jump=false;return input;
  }
}
