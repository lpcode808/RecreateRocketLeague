import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BALL_RADIUS, BLUE, ORANGE, clamp } from './config.js';
import { containCamera, smoothHeading } from './camera.js';
import { createCar, createBall, canvasTexture } from './assets.js';
import { createArena } from './arena.js';
import { Effects } from './effects.js';
export class Renderer{
  constructor(container){
    this.scene=new T.Scene();this.scene.background=new T.Color(0x263e59);this.scene.fog=new T.FogExp2(0x263e59,.0015);
    this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;container.appendChild(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','3D rocket car soccer arena');
    this.camera=new T.PerspectiveCamera(90,innerWidth/innerHeight,.08,650);this.camera.position.set(0,4,74);this.look=new T.Vector3(0,1,55);this.lastForward=new T.Vector3(0,0,-1);this.cameraMode='chase';this.shake=0;this.quality='high';
    const pmrem=new T.PMREMGenerator(this.renderer),env=new RoomEnvironment();this.scene.environment=pmrem.fromScene(env,.02).texture;env.dispose();pmrem.dispose();this.scene.environmentIntensity=.45;
    this.scene.add(new T.HemisphereLight(0xb5d3ff,0x354629,.95));
    const sun=new T.DirectionalLight(0xffeed5,1.6);sun.position.set(-65,100,35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-115,right:115,top:130,bottom:-130,near:1,far:300});sun.shadow.bias=-.0002;sun.shadow.normalBias=.025;this.scene.add(sun);this.sun=sun;
    for(const s of[-1,1]){const fill=new T.DirectionalLight(s<0?0xd6e8ff:0xffe4c8,.6);fill.position.set(s*80,45,-40);this.scene.add(fill);}
    // Sky dome gives a pale horizon and blue upper sky beyond the open stadium roof.
    const sky=new T.Mesh(new T.SphereGeometry(480,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 vP; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);} void main(){vec3 dir=normalize(vP);float h=clamp(dir.y,0.,1.);vec3 col=mix(vec3(.07,.12,.2),vec3(.008,.017,.043),pow(h,.65));vec2 p=dir.xz/max(.15,h)*2.;float cloud=noise(p)*.55+noise(p*2.1)*.25+noise(p*4.2)*.13;cloud=smoothstep(.47,.76,cloud)*smoothstep(0.,.22,h);col+=vec3(.08,.085,.11)*cloud;float star=step(.9988,hash(floor(dir.xz/max(.3,h)*380.)))*h;col+=star*.12;gl_FragColor=vec4(col,1.);}` }));this.scene.add(sky);
    const {pads}=createArena(this.scene);this.pads=pads;
    this.cars=[createCar(BLUE),createCar(ORANGE)];this.cars.forEach(c=>this.scene.add(c.group));this.ball=createBall(BALL_RADIUS);this.scene.add(this.ball);this.effects=new Effects(this.scene);
    this.trails=this.cars.map((c,i)=>{const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(12*6*3*2),3));geo.setAttribute('color',new T.BufferAttribute(new Float32Array(12*6*3*2),3));geo.setDrawRange(0,0);const mesh=new T.Mesh(geo,new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));mesh.frustumCulled=false;this.scene.add(mesh);return {mesh,history:[],color:new T.Color(i===0?0x83c5ff:0xffb745)};});
    const shadowMap=canvasTexture(64,64,c=>{const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(0,0,0,.65)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,64,64);});
    this.ballShadow=new T.Mesh(new T.PlaneGeometry(5.4,5.4),new T.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false}));this.ballShadow.rotation.x=-Math.PI/2;this.scene.add(this.ballShadow);
    this.carShadows=this.cars.map(()=>{const m=new T.Mesh(new T.PlaneGeometry(2.8,3.6),new T.MeshBasicMaterial({map:shadowMap,transparent:true,opacity:.85,depthWrite:false}));m.rotation.x=-Math.PI/2;this.scene.add(m);return m;});
    this.ballRing=new T.Mesh(new T.RingGeometry(2,2.07,48),new T.MeshBasicMaterial({color:0xeaf0dc,transparent:true,opacity:.4,side:T.DoubleSide,depthWrite:false}));this.ballRing.rotation.x=-Math.PI/2;this.scene.add(this.ballRing);
    this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));this.bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.2,.45,1.5);this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());
    window.addEventListener('resize',()=>this.resize());this.time=0;this.frameCount=0;
  }
  resize(){this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);this.composer.setSize(innerWidth,innerHeight);}
  setQuality(q){this.quality=q;const ratio=q==='high'?Math.min(devicePixelRatio,1.5):1;this.renderer.setPixelRatio(ratio);this.composer.setPixelRatio(ratio);this.bloom.enabled=q==='high';this.renderer.shadowMap.enabled=q==='high';this.resize();}
  update(physics,dt,paused=false){
    this.time+=dt;this.frameCount++;
    for(let i=0;i<2;i++){
      const car=physics.cars[i],visual=this.cars[i];visual.group.visible=car.demoTime<=0;visual.group.position.copy(car.body.translation());visual.group.quaternion.copy(car.body.rotation());visual.flame.visible=car.boosting&&!paused;
      const shadow=this.carShadows[i];shadow.position.set(visual.group.position.x,.027,visual.group.position.z);shadow.material.opacity=car.demoTime>0?0:Math.max(0,.9-visual.group.position.y*.15);shadow.rotation.z=-new T.Euler().setFromQuaternion(visual.group.quaternion,'YXZ').y;
      visual.flame.scale.z=.8+Math.random()*.5;
      visual.wheels.forEach(w=>{w.wheel.rotation.x-=car.speed*dt/.365;w.pivot.rotation.y=w.front?-car.steer*.35:0;});
      const trail=this.trails[i];
      if(car.boosting&&!paused){const q=visual.group.quaternion,nozzles=[];for(let n=0;n<2;n++){const p=new T.Vector3((n-.5)*.64,-.05,1.5).applyQuaternion(q).add(visual.group.position);nozzles.push(p);const velocity=new T.Vector3((Math.random()-.5)*2,(Math.random()-.5)*2,9+Math.random()*5).applyQuaternion(q);this.effects.emit(p,velocity,i===0?0x86c5ff:0xffb347,.16,.2+Math.random()*.2);}trail.history.unshift({points:nozzles,right:new T.Vector3(1,0,0).applyQuaternion(q)});trail.history.length=Math.min(trail.history.length,13);while(trail.history.length>1&&trail.history[0].points[0].distanceTo(trail.history.at(-1).points[0])>4.5)trail.history.pop();
        const positions=trail.mesh.geometry.attributes.position,colors=trail.mesh.geometry.attributes.color;let index=0;
        for(let j=0;j<trail.history.length-1;j++)for(let n=0;n<2;n++){const a=trail.history[j],b=trail.history[j+1],wa=.06*(1-j/13),wb=.06*(1-(j+1)/13),ap=a.points[n].clone().addScaledVector(a.right,wa),am=a.points[n].clone().addScaledVector(a.right,-wa),bp=b.points[n].clone().addScaledVector(b.right,wb),bm=b.points[n].clone().addScaledVector(b.right,-wb);for(const p of[ap,am,bp,am,bm,bp]){positions.setXYZ(index,p.x,p.y,p.z);const bright=(1-j/13)*1.8;colors.setXYZ(index,trail.color.r*bright,trail.color.g*bright,trail.color.b*bright);index++;}}positions.needsUpdate=colors.needsUpdate=true;trail.mesh.geometry.setDrawRange(0,index);
      }else if(!paused){trail.history.length=0;trail.mesh.geometry.setDrawRange(0,0);}
    }
    const bp=physics.ball.translation(),bv=physics.ball.linvel();this.ball.position.copy(bp);this.ball.quaternion.copy(physics.ball.rotation());this.ballShadow.position.set(bp.x,.035,bp.z);this.ballShadow.material.opacity=clamp(1-bp.y/45,.12,1);this.ballShadow.scale.setScalar(1+bp.y*.02);this.ballRing.position.set(bp.x,.04,bp.z);
    if(Math.hypot(bv.x,bv.y,bv.z)>25&&!paused){this.effects.emit(bp,{x:-bv.x*.12,y:.3,z:-bv.z*.12},0xc5d4d8,.6,.35);this.effects.smokeTrail(bp);}
    for(const p of this.pads){const active=p.cooldown<=0;p.ring.material.emissiveIntensity=active?2.2:.05;p.core.visible=active;if(p.core.userData.orb){p.core.userData.orb.visible=active;p.core.userData.orb.rotation.y=this.time;p.core.userData.orb.position.y=.85+Math.sin(this.time*2)*.1;}}
    this.effects.update(paused?0:dt);
    const car=physics.cars[0],pos=new T.Vector3().copy(car.body.translation()),q=new T.Quaternion().copy(car.body.rotation());
    let forward=new T.Vector3(0,0,-1).applyQuaternion(q);forward.y=0;if(forward.lengthSq()>.15){const heading=smoothHeading(this.lastForward,forward.normalize(),1-Math.exp(-dt*7));this.lastForward.set(heading.x,0,heading.z);}forward=this.lastForward.clone();
    if(this.cameraMode==='ball'){const toward=new T.Vector3().copy(bp).sub(pos);toward.y=0;if(toward.length()>3){const heading=smoothHeading(forward,toward.normalize(),.95);forward.set(heading.x,0,heading.z);}}
    const speed=car.speed,desired=pos.clone().addScaledVector(forward,-(5.4+speed*.02));desired.y=pos.y+2.2+Math.min(speed*.006,.3);
    if(this.cameraMode==='ball'){const elevation=clamp(bp.y-pos.y,0,30);desired.addScaledVector(forward,-elevation*.15);desired.y+=elevation*.12;}
    const velocity=new T.Vector3().copy(car.body.linvel());desired.addScaledVector(velocity,.1);
    Object.assign(desired,containCamera(desired));
    if(car.demoTime>0)desired.set(0,18,70);
    this.camera.position.lerp(desired,1-Math.exp(-dt*8));const lookTarget=pos.clone().addScaledVector(forward,15);lookTarget.y+=2;
    lookTarget.addScaledVector(velocity,.065);
    if(this.cameraMode==='ball'){lookTarget.lerp(new T.Vector3().copy(bp),.65);lookTarget.y=Math.min(lookTarget.y,pos.y+8);}
    this.look.lerp(lookTarget,1-Math.exp(-dt*12));this.camera.lookAt(this.look);
    if(this.shake>.001){this.camera.position.x+=(Math.random()-.5)*this.shake;this.camera.position.y+=(Math.random()-.5)*this.shake;this.shake*=Math.exp(-dt*6);}
    Object.assign(this.camera.position,containCamera(this.camera.position));
    const targetFov=90+(car.boosting?5:0);this.camera.fov+=(targetFov-this.camera.fov)*(1-Math.exp(-dt*3));this.camera.updateProjectionMatrix();
    this.composer.render();
  }
  snap(physics){const p=physics.cars[0].body.translation();this.lastForward.set(0,0,-1);this.camera.position.set(p.x,p.y+2.7,p.z+6.4);this.look.set(p.x,p.y+.8,p.z-5);}
}
