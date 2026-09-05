// Touch input is separate from keyboard state; both feed the same physics input.
export function stickAxes(x,y,radius){
  const length=Math.hypot(x,y),strength=Math.min(1,Math.max(0,(length/radius-.12)/.88));
  return length?{steer:x/length*strength,throttle:-y/length*strength}:{steer:0,throttle:0};
}
export class TouchUI{
  constructor(controls,onAction){
    this.controls=controls;this.onAction=onAction;this.pointers=new Map();this.blocked=false;
    this.coarse=matchMedia('(pointer: coarse)');
    this.enabled=this.coarse.matches;
    document.body.insertAdjacentHTML('beforeend',`
      <div id="touch-controls" hidden aria-label="Touch game controls">
        <div class="touch-drive"><div id="drive-stick" aria-label="Drag to drive: up forward, down reverse, left and right steer"><span class="stick-label">DRIVE</span><span class="stick-knob"></span></div></div>
        <div class="touch-actions"><button data-hold="drift" class="touch-drift">DRIFT</button><button data-hold="jumpHeld" class="touch-jump">JUMP</button><button data-hold="boost" class="touch-boost">BOOST</button></div>
        <div class="touch-roll"><button data-roll="-1" aria-label="Air roll left">ROLL ‹</button><button data-roll="1" aria-label="Air roll right">ROLL ›</button></div>
      </div>
      <div id="rotate-overlay" hidden role="dialog" aria-modal="true" aria-labelledby="rotate-title"><div class="rotate-panel"><svg viewBox="0 0 100 80" width="100" height="80" aria-hidden="true"><rect x="17" y="20" width="66" height="40" rx="7" fill="none" stroke="currentColor" stroke-width="3"/><path d="M27 29v22M34 8h30l-7-6m7 6-7 6M66 72H36l7-6m-7 6 7 6" fill="none" stroke="currentColor" stroke-width="3"/></svg><h1 id="rotate-title">TURN YOUR PHONE</h1><p>Play in landscape for room to steer, jump and boost.</p><small>Your match is paused.<br>If the screen stays upright, turn off rotation lock.</small></div></div>`);
    this.root=document.querySelector('#touch-controls');this.overlay=document.querySelector('#rotate-overlay');
    this.stick=document.querySelector('#drive-stick');this.knob=this.stick.querySelector('.stick-knob');
    this.root.addEventListener('contextmenu',e=>e.preventDefault());
    this.stick.addEventListener('pointerdown',e=>{
      if(this.blocked||this.stickPointer!=null||e.button!==0)return;
      e.preventDefault();this.stickPointer=e.pointerId;this.stick.setPointerCapture(e.pointerId);this.moveStick(e);
    });
    this.stick.addEventListener('pointermove',e=>{if(e.pointerId===this.stickPointer)this.moveStick(e);});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])this.stick.addEventListener(name,e=>{if(e.pointerId===this.stickPointer){this.stickPointer=null;this.knob.style.transform='';controls.setTouch({throttle:0,steer:0});}});
    for(const button of this.root.querySelectorAll('button')){
      button.addEventListener('pointerdown',e=>{
        if(this.blocked||e.button!==0)return;e.preventDefault();button.setPointerCapture(e.pointerId);
        this.pointers.set(e.pointerId,button);this.syncButtons();
      });
      for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,e=>{this.pointers.delete(e.pointerId);this.syncButtons();});
    }
    controls.onClear=()=>this.clear();
    this.coarse.addEventListener('change',()=>{this.enabled=this.coarse.matches;this.layout();});
    // Hybrid laptops retain desktop UI until a finger is actually used.
    window.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!this.enabled){this.enabled=true;this.layout();}},{capture:true});
    window.addEventListener('resize',()=>this.layout());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)onAction('blur');});
    this.layout();
  }
  moveStick(e){
    const rect=this.stick.getBoundingClientRect(),radius=rect.width/2;
    const x=e.clientX-rect.left-radius,y=e.clientY-rect.top-radius,length=Math.hypot(x,y),scale=Math.min(1,radius*.64/(length||1));
    this.knob.style.transform=`translate(${x*scale}px,${y*scale}px)`;
    this.controls.setTouch(stickAxes(x,y,radius*.75));
  }
  syncButtons(){
    const active=[...this.pointers.values()];
    for(const b of this.root.querySelectorAll('button'))b.classList.toggle('held',active.includes(b));
    const values={roll:0};for(const key of ['boost','drift','jumpHeld'])values[key]=active.some(b=>b.dataset.hold===key);
    for(const sign of [-1,1])if(active.some(b=>Number(b.dataset.roll)===sign))values.roll+=sign;
    this.controls.setTouch(values);
  }
  clear(){this.pointers.clear();this.stickPointer=null;this.knob.style.transform='';this.controls.clearTouch();this.syncButtons();}
  setPaused(paused){this.blocked=paused;this.root.hidden=!this.enabled||paused;this.clear();}
  layout(){
    const portrait=this.enabled&&innerHeight>innerWidth;
    document.body.classList.toggle('touch-mode',this.enabled);
    this.overlay.hidden=!portrait;
    document.querySelector('#hud').inert=portrait;
    document.querySelector('#pause-overlay').inert=portrait;
    this.root.hidden=!this.enabled||this.blocked||portrait;
    if(portrait&&!this.portrait){this.clear();this.onAction('blur');}
    this.portrait=portrait;
  }
}
