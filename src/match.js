import { FIELD, BALL_RADIUS } from './config.js';
export function goalForBall(p) {
  if(Math.abs(p.x)+BALL_RADIUS>FIELD.goalWidth/2 || p.y+BALL_RADIUS>FIELD.goalHeight || p.y<0) return null;
  if(p.z < -FIELD.z-BALL_RADIUS) return 0;
  if(p.z > FIELD.z+BALL_RADIUS) return 1;
  return null;
}
export class Match {
  constructor(){this.reset();}
  reset(){this.score=[0,0];this.time=300;this.phase='kickoff';this.phaseTime=3;this.overtime=false;this.winner=null;this.goTime=0;}
  tick(dt,ball){
    if(this.phase==='finished')return null;
    if(this.phase!=='playing'){
      this.phaseTime-=dt;
      if(this.phaseTime<=0){if(this.phase==='goal'){this.phase='kickoff';this.phaseTime=3;return 'reset';}this.phase='playing';this.goTime=.8;return 'go';}
      return null;
    }
    this.goTime=Math.max(0,this.goTime-dt);
    const team=goalForBall(ball);
    if(team!==null){this.score[team]++;this.scoringTeam=team;this.phase=this.overtime?'finished':'goal';this.phaseTime=3.5;if(this.overtime)this.winner=team;return 'goal';}
    this.time+=this.overtime?dt:-dt;
    if(!this.overtime && this.time<=0){this.time=0;if(ball.y<=BALL_RADIUS+.1){if(this.score[0]===this.score[1]){this.overtime=true;this.phase='kickoff';this.phaseTime=3;return 'reset';}this.phase='finished';this.winner=this.score[0]>this.score[1]?0:1;return 'finish';}}
    return null;
  }
}
