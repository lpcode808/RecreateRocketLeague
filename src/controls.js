export class Controls {
  constructor(onAction) {
    this.keys = new Set(); this.jump = false;
    window.addEventListener('keydown',e=>{
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)&&e.code!=='Escape') return;
      if(e.target.closest('#pause-overlay')&&['Space','Enter','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))return;
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code)) e.preventDefault();
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
  clear(){this.keys.clear();this.jump=false;}
  read(){
    const k=(...codes)=>codes.some(c=>this.keys.has(c));
    const input={throttle:Number(k('KeyW','ArrowUp'))-Number(k('KeyS','ArrowDown')),steer:Number(k('KeyD','ArrowRight'))-Number(k('KeyA','ArrowLeft')),roll:Number(k('KeyE'))-Number(k('KeyQ')),boost:k('ShiftLeft','ShiftRight'),drift:k('ControlLeft','ControlRight'),jump:this.jump,jumpHeld:k('Space')};
    this.jump=false;return input;
  }
}
