import './style.css';
import * as T from 'three';
import { Physics, botInput } from './physics.js';
import { Renderer } from './render.js';
import { Controls } from './controls.js';
import { Match } from './match.js';
import { UI } from './ui.js';
import { AudioSystem } from './effects.js';
import { STEP, BLUE, ORANGE } from './config.js';
async function boot(){
  const physics=await new Physics().init(),render=new Renderer(document.querySelector('#game')),match=new Match(),audio=new AudioSystem();
  const settings={infinite:false,bot:true,paused:false};let accumulator=0,last=performance.now(),finishedShown=false,pendingJump=false;
  function pause(value){settings.paused=value;controls.clear();pendingJump=false;ui.paused(value,match.phase==='finished');accumulator=0;}
  function reset(){match.reset();physics.reset();render.snap(physics);render.pads.forEach(p=>p.cooldown=0);finishedShown=false;pause(false);}
  function action(name,value){
    if(name==='pause'){if(match.phase!=='finished')pause(!settings.paused);}
    if(name==='blur')pause(true);
    if(name==='help'){pause(true);ui.el['controls-details'].open=true;}
    if(name==='reset'){physics.resetCar(physics.cars[0]);render.snap(physics);ui.toast('CAR RECOVERED');}
    if(name==='camera'){render.cameraMode=render.cameraMode==='chase'?'ball':'chase';}
    if(name==='infinite'){settings.infinite=!settings.infinite;ui.toast(settings.infinite?'UNLIMITED BOOST':'STANDARD BOOST');}
    if(name==='mute'){audio.muted=!audio.muted;ui.el.sound.textContent=audio.muted?'×':'♪';ui.el.sound.setAttribute('aria-label',audio.muted?'Unmute sound':'Mute sound');}
    if(name==='restart')reset();
    if(name==='mode'){settings.bot=value==='bot';reset();}
    if(name==='quality')render.setQuality(value);
  }
  const ui=new UI(action),controls=new Controls(action);render.snap(physics);
  document.addEventListener('pointerdown',()=>audio.start());document.addEventListener('keydown',()=>audio.start(),{once:true});
  function physicsEvent(type,data){
    if(type==='hit'){render.effects.burst(data.position,0xffe7ba,15,7);render.shake=Math.min(.2,data.speed*.008);audio.tone(80+Math.max(0,data.speed)*5,.12,.35,'triangle');}
    if(type==='demo'){render.effects.burst(data.position,0xffa344,150,20);render.shake=.5;ui.toast('DEMOLITION');audio.tone(70,.6,.7,'sawtooth');}
  }
  function simulate(input){
    const active=match.phase==='playing';
    const neutral={throttle:0,steer:0,roll:0,boost:false,jump:false,jumpHeld:false};
    const previousResets=physics.cars[0].flipResets;
    if(active || match.phase==='goal')physics.step([input,botInput(physics.cars[1],physics.ball,settings.bot&&active)],STEP,settings.infinite,physicsEvent);
    else physics.step([neutral,neutral],STEP,settings.infinite);
    if(physics.cars[0].flipResets>previousResets){ui.toast('FLIP RESET');audio.tone(990,.2,.25);render.effects.burst(physics.cars[0].body.translation(),0xa8e5ff,30,4);}
    if(!settings.bot){physics.cars[1].body.setTranslation({x:0,y:-15,z:0},true);physics.cars[1].demoTime=99;}
    if(active){
      for(const p of render.pads){p.cooldown=Math.max(0,p.cooldown-STEP);if(p.cooldown>0)continue;for(const car of physics.cars){const pos=car.body.translation();if(car.demoTime<=0&&car.boost<100&&pos.y<2&&Math.hypot(pos.x-p.x,pos.z-p.z)<(p.large?2:1.35)){car.boost=Math.min(100,car.boost+(p.large?100:12));p.cooldown=p.large?10:4;if(car.team===0){audio.tone(p.large?700:520,.12,.15);if(p.large)ui.toast('BOOST FULL');}break;}}}
    }
    const event=match.tick(STEP,physics.ball.translation());
    if(event==='reset'){physics.reset();render.snap(physics);render.pads.forEach(p=>p.cooldown=0);}
    if(event==='go')audio.tone(880,.2,.25);
    if(event==='goal'){
      const pos=physics.ball.translation(),color=match.scoringTeam===0?BLUE:ORANGE;render.effects.burst(pos,color,550,40);render.effects.burst(pos,0xffffff,100,50);render.effects.goal(pos,color);render.shake=.75;audio.goal();
      for(const car of physics.cars){const direction=new T.Vector3().copy(car.body.translation()).sub(new T.Vector3().copy(pos)).normalize();car.body.applyImpulse(direction.multiplyScalar(180*20),true);}
    }
    if(match.phase==='finished'&&!finishedShown){finishedShown=true;setTimeout(()=>{if(match.phase==='finished')pause(true);},1600);}
  }
  function frame(now){
    const dt=Math.min((now-last)/1000,.05);last=now;
    if(!settings.paused){accumulator+=dt;const input=controls.read();pendingJump ||= input.jump;while(accumulator>=STEP){simulate({...input,jump:pendingJump});pendingJump=false;accumulator-=STEP;}}
    render.update(physics,dt,settings.paused);audio.update(physics.cars[0].speed,physics.cars[0].boosting,settings.paused);ui.update(match,physics.cars[0],render,settings,dt);requestAnimationFrame(frame);
  }
  document.querySelector('#loading').remove();requestAnimationFrame(frame);
  // Development-only, deterministic scenario entry points for reproducible physics QA.
  if(import.meta.env.DEV)window.__game={physics,render,match,settings,controls,reset,action,simulate,snapshot:()=>({phase:match.phase,score:[...match.score],time:match.time,car:{position:physics.cars[0].body.translation(),velocity:physics.cars[0].body.linvel(),rotation:physics.cars[0].body.rotation(),boost:physics.cars[0].boost,grounded:physics.cars[0].grounded,jumps:physics.cars[0].jumpCount},ball:physics.ball.translation(),camera:render.camera.position.toArray(),frames:render.frameCount})};
}
boot().catch(error=>{console.error(error);document.querySelector('#loading').innerHTML='COULD NOT START THE MATCH<span>Reload to try again. '+String(error.message).replaceAll('<','&lt;')+'</span>';});
