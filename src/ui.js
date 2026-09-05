export class UI {
  constructor(onAction){
    document.body.insertAdjacentHTML('beforeend',`<div id="hud">
      <div class="venue"><span class="venue-mark">RL</span><div>CHAMPIONS FIELD<small id="venue-mode">EXHIBITION · 1V1</small></div></div>
      <div class="scoreboard" aria-label="Match score"><div class="team blue"><span id="blue-score">0</span></div><div class="clock"><span id="timer">5:00</span><small id="match-label">EXHIBITION</small></div><div class="team orange"><span id="orange-score">0</span></div></div>
      <div class="top-actions"><button id="sound" title="Toggle sound (M)" aria-label="Mute sound">♪</button><button id="help-button" title="Controls (H)" aria-label="Show controls">?</button><button id="pause-button" title="Pause (P / Esc)" aria-label="Pause game">Ⅱ</button></div>
      <div id="announcement" aria-live="polite"><div id="announce-main"></div><div id="announce-sub"></div></div>
      <div id="toast" aria-live="polite"></div>
      <div class="camera-hud"><button id="camera-button"><span id="camera-indicator"></span><strong id="camera-mode">CAR CAM</strong></button><small>PRESS <kbd>C</kbd> TO TOGGLE</small><div class="quick-controls"><kbd>W A S D</kbd> DRIVE <i>·</i> <kbd>SPACE</kbd> JUMP <i>·</i> <kbd>SHIFT</kbd> BOOST</div></div>
      <div class="boost-hud"><div id="speed">0 <small>KM/H</small></div><svg viewBox="0 0 180 180" aria-hidden="true"><circle class="boost-track" cx="90" cy="90" r="72"/><circle id="boost-ring" cx="90" cy="90" r="72"/></svg><div class="boost-number"><strong id="boost-value">33</strong><span>BOOST</span></div><button id="infinite-button" title="Toggle infinite boost (B)"><kbd>B</kbd> <span id="boost-mode">UNLIMITED OFF</span></button></div>
      <div id="bot-name">MAVERICK</div>
    </div>
    <div id="pause-overlay" hidden><section class="pause-panel" role="dialog" aria-modal="true" aria-labelledby="pause-title"><div class="eyebrow">CHAMPIONS FIELD</div><h1 id="pause-title">MATCH PAUSED</h1><p id="pause-description">Take a breath. The pitch can wait.</p><button class="primary" id="resume">RESUME GAME <span>→</span></button><button id="restart">RESTART MATCH</button><div class="settings-row"><label for="mode">PLAY MODE</label><select id="mode"><option value="bot">1V1 · MAVERICK</option><option value="solo">SOLO PRACTICE</option></select></div><div class="settings-row"><label for="quality">GRAPHICS</label><select id="quality"><option value="high">HIGH</option><option value="performance">PERFORMANCE</option></select></div><details id="controls-details"><summary>KEYBOARD CONTROLS</summary><dl><dt>WASD / Arrows</dt><dd>Throttle & steering · pitch / yaw in air</dd><dt>Space</dt><dd>Jump · hold for height · tap again to flip</dd><dt>Shift</dt><dd>Boost</dd><dt>Q / E</dt><dd>Air roll left / right</dd><dt>Ctrl</dt><dd>Powerslide</dd><dt>B</dt><dd>Toggle infinite boost</dd><dt>C</dt><dd>Car cam / ball cam</dd><dt>R</dt><dd>Recover car</dd><dt>P / Esc</dt><dd>Pause</dd><dt>M</dt><dd>Sound on / off</dd></dl></details><small class="local-note">LOCAL EXHIBITION · BLUE TEAM</small></section></div>`);
    this.el=Object.fromEntries([...document.querySelectorAll('[id]')].map(el=>[el.id,el]));
    for(const[id,action]of Object.entries({'pause-button':'pause',resume:'pause',restart:'restart','camera-button':'camera','infinite-button':'infinite','help-button':'help',sound:'mute'}))this.el[id].addEventListener('click',()=>onAction(action));
    this.el.mode.addEventListener('change',()=>onAction('mode',this.el.mode.value));this.el.quality.addEventListener('change',()=>onAction('quality',this.el.quality.value));
    this.toastTime=0;this.oldAnnouncement='';
    document.addEventListener('keydown',e=>{if(e.code!=='Tab'||this.el['pause-overlay'].hidden)return;const focusable=[...this.el['pause-overlay'].querySelectorAll('button,select,summary')].filter(el=>el.offsetParent);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
  }
  paused(value,finished=false){this.el['pause-overlay'].hidden=!value;this.el['pause-title'].textContent=finished?'MATCH COMPLETE':'MATCH PAUSED';this.el['pause-description'].textContent=finished?'Another kickoff is one click away.':'Take a breath. The pitch can wait.';this.el.resume.hidden=finished;if(value)(finished?this.el.restart:this.el.resume).focus();else document.activeElement?.blur();}
  toast(text){this.el.toast.textContent=text;this.toastTime=2.4;this.el.toast.classList.add('visible');}
  update(match,car,renderer,settings,dt){
    this.el['blue-score'].textContent=match.score[0];this.el['orange-score'].textContent=match.score[1];const seconds=match.overtime?Math.floor(match.time):Math.ceil(match.time);this.el.timer.textContent=(match.overtime?'+':'')+`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
    this.el['match-label'].textContent=match.overtime?'OVERTIME':settings.bot?'EXHIBITION':'FREE PLAY';this.el['timer'].classList.toggle('urgent',!match.overtime&&match.time<30);
    this.el['venue-mode'].textContent=settings.bot?'EXHIBITION · 1V1':'SOLO PRACTICE';
    this.el['boost-value'].textContent=settings.infinite?'∞':Math.ceil(car.boost);this.el['boost-ring'].style.strokeDashoffset=339.29*(1-car.boost/100);this.el['boost-ring'].classList.toggle('active',car.boosting);this.el['boost-mode'].textContent=settings.infinite?'UNLIMITED ON':'UNLIMITED OFF';this.el['infinite-button'].classList.toggle('enabled',settings.infinite);this.el['infinite-button'].setAttribute('aria-pressed',String(settings.infinite));
    this.el.speed.innerHTML=`${Math.round(car.speed*1.8)} <small>KM/H</small>`;this.el['camera-mode'].textContent=renderer.cameraMode==='ball'?'BALL CAM':'CAR CAM';this.el['camera-indicator'].classList.toggle('active',renderer.cameraMode==='ball');
    let text='',sub='';
    if(match.phase==='kickoff'){text=String(Math.max(1,Math.ceil(match.phaseTime)));sub=match.overtime?'OVERTIME · NEXT GOAL WINS':'GET READY';}
    if(match.phase==='playing'&&match.goTime>0){text='GO!';sub='';}
    if(match.phase==='goal'){text=match.scoringTeam===0?'YOU SCORED!':'MAVERICK SCORED!';if(!settings.bot&&match.scoringTeam===1)text='ORANGE SCORED!';sub='GOAL';}
    if(match.phase==='finished'){text=match.winner===0?'BLUE WINS':'ORANGE WINS';sub='FINAL SCORE';}
    if(text!==this.oldAnnouncement){this.el['announce-main'].textContent=text;this.el['announce-sub'].textContent=sub;this.el.announcement.className=match.phase==='goal'?'goal':'countdown';this.oldAnnouncement=text;}
    this.el.announcement.style.opacity=text?1:0;
    this.toastTime-=dt;if(this.toastTime<=0)this.el.toast.classList.remove('visible');
    const bot=renderer.cars[1].group.position.clone();bot.y+=1.9;bot.project(renderer.camera);const visible=settings.bot&&renderer.cars[1].group.visible&&bot.z<1&&Math.abs(bot.x)<1&&Math.abs(bot.y)<1;this.el['bot-name'].style.display=visible?'block':'none';this.el['bot-name'].style.left=`${(bot.x*.5+.5)*100}%`;this.el['bot-name'].style.top=`${(-bot.y*.5+.5)*100}%`;
  }
}
