import RAPIER from '@dimforge/rapier3d-compat';
import * as T from 'three';
import { FIELD as F, BALL_RADIUS, CAR, STEP, clamp } from './config.js';
import { cornerRamp } from './arena-geometry.js';
const v3=v=>new T.Vector3(v.x,v.y,v.z);
const UP=new T.Vector3(0,1,0),FORWARD=new T.Vector3(0,0,-1),RIGHT=new T.Vector3(1,0,0);
export class Physics {
  async init(){
    await RAPIER.init();this.world=new RAPIER.World({x:0,y:-13,z:0});this.world.timestep=STEP;
    this.world.numSolverIterations=8;this.world.numInternalPgsIterations=2;
    const fixed=(size,pos)=>this.world.createCollider(RAPIER.ColliderDesc.cuboid(...size).setTranslation(...pos).setFriction(.5).setRestitution(.3));
    fixed([F.x+20,.5,F.z+F.goalDepth+2],[0,-.5,0]);fixed([F.x+1,.5,F.z+F.goalDepth],[0,F.height+.5,0]);
    for(const s of [-1,1]){
      fixed([.5,F.height/2,F.z],[s*(F.x+.5),F.height/2,0]);
      for(const x of [-1,1])fixed([(F.x-F.goalWidth/2)/2,F.height/2,.5],[x*(F.x+F.goalWidth/2)/2,F.height/2,s*(F.z+.5)]);
      fixed([F.goalWidth/2,(F.height-F.goalHeight)/2,.5],[0,(F.height+F.goalHeight)/2,s*(F.z+.5)]);
      fixed([F.goalWidth/2,F.goalHeight/2,.5],[0,F.goalHeight/2,s*(F.z+F.goalDepth+.5)]);
      fixed([F.goalWidth/2,.5,F.goalDepth/2],[0,F.goalHeight+.5,s*(F.z+F.goalDepth/2)]);
      for(const x of [-1,1])fixed([.5,F.goalHeight/2,F.goalDepth/2],[x*(F.goalWidth/2+.5),F.goalHeight/2,s*(F.z+F.goalDepth/2)]);
    }
    for(const axis of ['x','z'])for(const sign of [-1,1]){
      const lengths=axis==='x'?[[-F.z+F.corner,F.z-F.corner]]:[[-F.x+F.corner,-F.goalWidth/2],[F.goalWidth/2,F.x-F.corner]];
      for(const [start,end]of lengths){const pos=[],indices=[];for(let i=0;i<=16;i++){const a=i/16*Math.PI/2,d=F.ramp*Math.sin(a),y=F.ramp*(1-Math.cos(a));for(const l of[start,end])pos.push(...(axis==='x'?[sign*(F.x-F.ramp+d),y,l]:[l,y,sign*(F.z-F.ramp+d)]));}for(let i=0;i<16;i++){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}this.world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(pos),new Uint32Array(indices)).setFriction(.4).setRestitution(.4));}
    }
    // Rounded corners prevent the ball lodging in a ninety-degree seam.
    for(const sx of[-1,1])for(const sz of[-1,1]){const {vertices,indices}=cornerRamp(sx,sz);this.world.createCollider(RAPIER.ColliderDesc.trimesh(vertices,indices).setFriction(.4).setRestitution(.4));}
    for(const sx of[-1,1])for(const sz of[-1,1])for(let i=0;i<12;i++){
      const a=(i+.5)/12*Math.PI/2,cx=sx*(F.x-F.corner),cz=sz*(F.z-F.corner);
      const collider=RAPIER.ColliderDesc.cuboid(.7,F.height/2,F.corner*Math.PI/48+.08).setTranslation(cx+sx*F.corner*Math.cos(a),F.height/2,cz+sz*F.corner*Math.sin(a)).setRotation(new T.Quaternion().setFromAxisAngle(UP,-sx*sz*a));this.world.createCollider(collider);
    }
    this.ball=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,BALL_RADIUS+.04,0).setLinearDamping(.03).setAngularDamping(.1).setCcdEnabled(true));
    this.ballCollider=this.world.createCollider(RAPIER.ColliderDesc.ball(BALL_RADIUS).setMass(30).setFriction(.35).setRestitution(.6),this.ball);
    this.cars=[this.makeCar(0),this.makeCar(1)];this.reset();return this;
  }
  makeCar(team){
    const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setLinearDamping(.02).setAngularDamping(1).setCcdEnabled(true).setCanSleep(false));
    // RocketSim Octane dimensions/offsets, at 50 source units per world unit; radius is included in the extents.
    const collider=this.world.createCollider(RAPIER.ColliderDesc.roundCuboid(.811994,.331591,1.15007,.055).setTranslation(0,.4151,-.277514).setMass(CAR.mass).setFriction(.15).setRestitution(.05),body);
    return {body,collider,team,boost:33,grounded:false,wheelContacts:0,normal:UP.clone(),jumpCount:0,airTime:0,jumpAge:10,flipTime:0,hitCooldown:0,demoTime:0,boosting:false,speed:0,steer:0,flipResets:0};
  }
  resetCar(car){const z=car.team===0?65:-65;car.body.setTranslation({x:0,y:.8,z},true);car.body.setRotation(new T.Quaternion().setFromAxisAngle(UP,car.team===0?0:Math.PI),true);car.body.setLinvel({x:0,y:0,z:0},true);car.body.setAngvel({x:0,y:0,z:0},true);car.body.resetForces(true);car.body.resetTorques(true);car.jumpCount=0;car.jumpAge=10;car.flipTime=0;car.demoTime=0;car.boosting=false;car.speed=0;car.steer=0;car.airTime=0;car.grounded=false;car.hasFlipReset=false;}
  reset(){this.cars.forEach(c=>{this.resetCar(c);c.boost=33;});this.ball.setTranslation({x:0,y:BALL_RADIUS+.04,z:0},true);this.ball.setLinvel({x:0,y:0,z:0},true);this.ball.setAngvel({x:0,y:0,z:0},true);}
  updateCar(car,input,dt,infinite=false){
    input={throttle:0,steer:0,roll:0,boost:false,jump:false,jumpHeld:false,drift:false,...input};
    const driveThrottle=input.boost&&(infinite||car.boost>0)?1:input.throttle;
    const body=car.body;car.hitCooldown=Math.max(0,car.hitCooldown-dt);car.jumpAge+=dt;
    if(car.demoTime>0){car.demoTime-=dt;if(car.demoTime<=0)this.resetCar(car);return;}
    const q=new T.Quaternion().copy(body.rotation()),pos=v3(body.translation()),vel=v3(body.linvel()),forward=FORWARD.clone().applyQuaternion(q),right=RIGHT.clone().applyQuaternion(q),up=UP.clone().applyQuaternion(q);
    const normal=new T.Vector3();let contacts=0,ballContacts=0;
    for(const x of[-.7,.7])for(const z of[-.77,.77]){
      const origin=new T.Vector3(x,.12,z).applyQuaternion(q).add(pos),dir=up.clone().negate();
      const hit=this.world.castRayAndGetNormal(new RAPIER.Ray(origin,dir),.92,true,undefined,undefined,undefined,body);
      if(hit && hit.timeOfImpact<.88){
        const n=v3(hit.normal);if(n.dot(up)<.35)continue;
        if(hit.collider.handle===this.ballCollider.handle){ballContacts++;continue;}
        contacts++;normal.add(n);
        const speed=v3(body.velocityAtPoint(origin)).dot(n),spring=clamp((.78-hit.timeOfImpact)*125-speed*8,-6,65);
        if(car.jumpAge>.18)body.applyImpulseAtPoint(n.multiplyScalar(spring*CAR.mass*dt/4),origin,true);
      }
    }
    if(ballContacts===4&&car.jumpAge>.2&&car.jumpCount>0){car.jumpCount=0;car.jumpAge=10;car.flipResets++;car.hasFlipReset=true;}
    car.wheelContacts=contacts;car.grounded=contacts>=2&&car.jumpAge>.18;
    car.airTime=car.grounded?0:car.airTime+dt;
    if(car.grounded){
      car.normal.copy(normal.normalize());car.jumpCount=0;car.hasFlipReset=false;
      const tangent=forward.clone().projectOnPlane(car.normal).normalize(),lateral=right.clone().projectOnPlane(car.normal).normalize();
      const longitudinal=vel.dot(tangent),side=vel.dot(lateral),steerSpeed=clamp(Math.abs(longitudinal)/7,.05,1);
      const acceleration=driveThrottle===0?-longitudinal*1.4:driveThrottle*(Math.sign(longitudinal)!==Math.sign(driveThrottle)&&Math.abs(longitudinal)>1?65:Math.max(0,32*(1-Math.abs(longitudinal)/CAR.driveSpeed)));
      body.applyImpulse(tangent.multiplyScalar(acceleration*CAR.mass*dt),true);
      body.applyImpulse(lateral.multiplyScalar(-side*CAR.mass*Math.min(1,dt*(input.drift?1.4:12))),true);
      body.applyImpulse(car.normal.clone().multiplyScalar(-CAR.mass*13*dt*.65),true);
      if(car.flipTime<=0){
        const align=up.clone().cross(car.normal).multiplyScalar(10),angular=v3(body.angvel());
        const turn=-input.steer*(input.drift?2.7:2.05)*steerSpeed*(longitudinal<-.5?-1:1)*(1-Math.min(Math.abs(longitudinal)/100,.4));
        const desired=car.normal.clone().multiplyScalar(turn).add(align);angular.lerp(desired,1-Math.exp(-dt*15));body.setAngvel(angular,true);
      }
    }else if(car.flipTime<=0){
      const angular=v3(body.angvel()),desired=right.clone().multiplyScalar(-input.throttle*2.7).addScaledVector(up,-input.steer*2.2).addScaledVector(forward,input.roll*3.6);
      angular.lerp(desired,1-Math.exp(-dt*3.4));body.setAngvel(angular,true);
    }
    if(input.jump){
      if(up.y<-.2&&pos.y<1.25&&car.airTime>.3){
        body.applyImpulse(UP.clone().multiplyScalar(CAR.mass*4),true);car.flipAxis=forward;car.flipTime=.4;car.flipSpeed=Math.PI/.4;car.jumpCount=1;car.jumpAge=0;
      }else if(car.grounded || (car.jumpCount===0&&car.airTime<.1&&!car.hasFlipReset)){
        body.applyImpulse(up.clone().multiplyScalar(CAR.mass*CAR.jumpSpeed),true);car.jumpCount=1;car.jumpAge=0;car.grounded=false;
      }else if(car.jumpCount===0 || (car.jumpCount===1&&car.jumpAge<CAR.doubleWindow)){
        const directional=Math.abs(input.throttle)+Math.abs(input.steer)>.1;
        if(directional){
          const direction=forward.clone().multiplyScalar(input.throttle).addScaledVector(right,input.steer).normalize();
          body.applyImpulse(direction.multiplyScalar(CAR.mass*10).addScaledVector(UP,CAR.mass*1.5),true);
          car.flipAxis=right.clone().multiplyScalar(-input.throttle).addScaledVector(forward,input.steer).normalize();car.flipTime=.65;car.flipSpeed=2*Math.PI/.65;
        }else body.applyImpulse(up.clone().multiplyScalar(CAR.mass*CAR.jumpSpeed),true);
        car.jumpCount=2;
      }
    }
    if(input.jumpHeld&&car.jumpAge<.2&&car.jumpCount===1)body.applyImpulse(up.clone().multiplyScalar(CAR.mass*29.16*dt),true);
    if(car.flipTime>0){car.flipTime-=dt;body.setAngvel(car.flipAxis.clone().multiplyScalar(car.flipSpeed),true);if(car.flipTime<=0)body.setAngvel({x:0,y:0,z:0},true);}
    car.boosting=input.boost&&(infinite||car.boost>0);
    if(car.boosting){body.applyImpulse(forward.clone().multiplyScalar(CAR.mass*CAR.boostAcceleration*dt),true);car.boost=infinite?100:Math.max(0,car.boost-CAR.boostDrain*dt);}
    if(infinite)car.boost=100;
    const current=v3(body.linvel());if(current.length()>CAR.maxSpeed)body.setLinvel(current.setLength(CAR.maxSpeed),true);
    car.speed=current.length();car.steer=input.steer;
    if(pos.y < -10 || Math.abs(pos.x)>F.x+25 || Math.abs(pos.z)>F.z+F.goalDepth+8)this.resetCar(car);
  }
  step(inputs,dt,infinite,onEvent){
    this.cars.forEach((car,i)=>this.updateCar(car,inputs[i],dt,i===0&&infinite));this.world.step();
    for(const car of this.cars){
      if(car.demoTime>0)continue;
      let contact=false;this.world.contactPair(car.collider,this.ballCollider,()=>{contact=true;});
      if(contact&&car.hitCooldown<=0){
        const delta=v3(this.ball.translation()).sub(v3(car.body.translation())).normalize(),speed=v3(car.body.linvel()).dot(delta);
        if(speed>2){delta.y=Math.max(delta.y,.18);this.ball.applyImpulse(delta.multiplyScalar(Math.min(speed*.35,12)*30),true);}
        car.hitCooldown=.16;onEvent?.('hit',{car,position:this.ball.translation(),speed});
      }
    }
    const [a,b]=this.cars;
    if(a.demoTime<=0&&b.demoTime<=0){let contact=false;this.world.contactPair(a.collider,b.collider,()=>{contact=true;});if(contact){const faster=a.speed>b.speed?a:b,slower=faster===a?b:a;if(faster.speed>42){onEvent?.('demo',{position:slower.body.translation()});slower.demoTime=3;slower.body.setTranslation({x:0,y:-20,z:0},true);slower.body.setLinvel({x:0,y:0,z:0},true);}}}
    const bv=v3(this.ball.linvel());if(bv.length()>120)this.ball.setLinvel(bv.setLength(120),true);
    if(this.ball.translation().y< -5)this.reset();
  }
}
export function botInput(car,ball,enabled=true){
  if(!enabled)return {throttle:0,steer:0,roll:0,boost:false,jump:false,jumpHeld:false};
  const pos=v3(car.body.translation()),bp=v3(ball.translation()),bv=v3(ball.linvel());
  const predicted=bp.clone().addScaledVector(bv,.28),attack=new T.Vector3(0,0,F.z).sub(predicted).setY(0).normalize();
  const target=predicted.clone().addScaledVector(attack,-6);
  // Approach from behind the ball; drive around it when returning from the wrong side.
  if(pos.clone().sub(bp).dot(attack)>1){const side=pos.x>bp.x?1:-1;target.x+=side*10;target.z-=4;}
  else if(pos.distanceTo(bp)<9)target.copy(predicted).addScaledVector(attack,3);
  const local=target.sub(pos).applyQuaternion(new T.Quaternion().copy(car.body.rotation()).invert());
  const angle=Math.atan2(local.x,-local.z),distance=local.length();
  const upside=UP.clone().applyQuaternion(new T.Quaternion().copy(car.body.rotation())).y<-.2;
  return {throttle:Math.abs(angle)>2.4&&distance<12?-.55:1,steer:clamp(angle*1.8,-1,1),boost:Math.abs(angle)<.16&&distance>28&&car.boost>15,jump:(bp.y>3&&bp.y<7&&pos.distanceTo(bp)<5&&car.grounded)||(upside&&pos.y<1.2&&car.flipTime<=0),jumpHeld:false,roll:0,drift:Math.abs(angle)>1.3};
}
