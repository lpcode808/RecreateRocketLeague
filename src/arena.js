import * as T from 'three';
import { FIELD as F, BLUE, ORANGE, PAD_POSITIONS } from './config.js';
import { box, cylinder, material, glow, tube, canvasTexture, labelTexture } from './assets.js';
import { cornerRamp } from './arena-geometry.js';
export function createArena(scene){
  const arena=new T.Group();scene.add(arena);
  const concrete=material(0x273449,.3,.75),steel=material(0x526479,.65,.35),dark=material(0x0c1627,.2,.8);
  const turf=canvasTexture(2048,2048,(c,w,h)=>{
    c.fillStyle='#49734a';c.fillRect(0,0,w,h);
    let seed=46;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<16;i++){c.fillStyle=i%2?'#3c6241':'#4b744b';c.fillRect(0,i*h/16,w,h/16);}
    for(let i=0;i<180000;i++){c.fillStyle=random()>.5?'rgba(164,185,99,.13)':'rgba(9,35,22,.18)';c.fillRect(random()*w,random()*h,1,2+random()*4);}
    c.fillStyle='rgba(15,121,235,.13)';c.fillRect(0,h/2,w,h/2);c.fillStyle='rgba(250,143,32,.11)';c.fillRect(0,0,w,h/2);
    c.strokeStyle='rgba(213,226,202,.76)';c.lineWidth=3;
    c.strokeRect(58,48,w-116,h-96);c.beginPath();c.moveTo(58,h/2);c.lineTo(w-58,h/2);c.stroke();c.beginPath();c.ellipse(w/2,h/2,166,133,0,0,Math.PI*2);c.stroke();
    for(const top of [true,false]){const z=top?48:h-48,sign=top?1:-1;c.strokeRect(w/2-300,z,600,sign*240);c.strokeRect(w/2-225,z,450,sign*105);c.beginPath();c.arc(w/2,z+sign*240,100,top?0:Math.PI,top?Math.PI:Math.PI*2);c.stroke();
      c.save();c.translate(w/2,z+sign*133);if(!top)c.rotate(Math.PI);c.fillStyle=top?'rgba(240,165,71,.16)':'rgba(110,184,255,.16)';c.font='bold italic 80px sans-serif';c.textAlign='center';c.fillText('CHAMPIONS',0,0);c.restore();}
    c.strokeStyle='rgba(238,244,223,.1)';c.lineWidth=18;c.beginPath();c.arc(w/2,h/2,110,0,Math.PI*2);c.stroke();
    c.save();c.translate(w/2,h/2);c.strokeStyle='rgba(230,240,223,.2)';c.lineWidth=9;c.beginPath();c.moveTo(-62,-65);c.lineTo(62,-65);c.lineTo(53,25);c.lineTo(0,73);c.lineTo(-53,25);c.closePath();c.stroke();c.font='bold italic 46px sans-serif';c.textAlign='center';c.fillStyle='rgba(230,240,223,.22)';c.fillText('RL',0,14);c.restore();
  });
  const field=box(arena,[F.x*2,.15,F.z*2],[0,-.09,0],new T.MeshStandardMaterial({map:turf,color:0xb6cd78,roughness:1,envMapIntensity:.12}));field.receiveShadow=true;
  const wallMap=canvasTexture(256,256,(c)=>{c.clearRect(0,0,256,256);c.strokeStyle='rgba(181,220,239,.23)';c.lineWidth=1.2;for(let row=-1;row<7;row++)for(let col=-1;col<6;col++){const x=col*64+(row%2)*32,y=row*55.4;c.beginPath();for(let n=0;n<=6;n++){let a=n*Math.PI/3;c.lineTo(x+37*Math.sin(a),y+37*Math.cos(a));}c.stroke();}});wallMap.wrapS=wallMap.wrapT=T.RepeatWrapping;wallMap.repeat.set(16,3);
  const glass=new T.MeshBasicMaterial({map:wallMap,transparent:true,opacity:.34,side:T.DoubleSide,depthWrite:false});
  for(const s of [-1,1]){
    box(arena,[.12,F.height,F.z*2],[s*F.x,F.height/2,0],glass);
    box(arena,[F.x*2,F.height,.12],[0,F.height/2,s*F.z],glass);
    const tint=s<0?ORANGE:BLUE;
    box(arena,[.35,1.4,F.z*2],[s*(F.x+.2),1,0],dark);
    for(const half of [-1,1])box(arena,[.2,.14,F.z],[s*(F.x-.1),1.8,half*F.z/2],glow(half<0?ORANGE:BLUE,1.5));
    const gm=glow(tint,2.1),frame=material(tint,.65,.27),half=F.goalWidth/2;
    for(const x of [-1,1]){
      box(arena,[F.x-half,1.7,.6],[x*(F.x+half)/2,.9,s*F.z],dark);
      box(arena,[F.x-half,.15,.2],[x*(F.x+half)/2,1.85,s*(F.z-.4)],gm);
      tube(arena,[[x*half,0,s*F.z],[x*half,F.goalHeight-1,s*F.z],[x*(half-1),F.goalHeight,s*F.z]],.36,frame);
      tube(arena,[[x*(half-.32),.2,s*(F.z-.2)],[x*(half-.32),F.goalHeight-1,s*(F.z-.2)],[x*(half-1),F.goalHeight-.32,s*(F.z-.2)]],.08,gm);
      box(arena,[.13,F.goalHeight,F.goalDepth],[x*half,F.goalHeight/2,s*(F.z+F.goalDepth/2)],glass);
    }
    box(arena,[F.goalWidth-2,.65,.7],[0,F.goalHeight,s*F.z],frame,.2);
    box(arena,[F.goalWidth-2,.1,.12],[0,F.goalHeight-.3,s*(F.z-.4)],gm);
    box(arena,[F.goalWidth,.15,F.goalDepth],[0,.015,s*(F.z+F.goalDepth/2)],material(s<0?0x795936:0x244e76,.3,.6));
    box(arena,[F.goalWidth,F.goalHeight,.15],[0,F.goalHeight/2,s*(F.z+F.goalDepth)],glass);
    box(arena,[F.goalWidth,.1,F.goalDepth],[0,F.goalHeight,s*(F.z+F.goalDepth/2)],glass);
    for(let x=-half;x<half;x+=3)tube(arena,[[x,0,s*(F.z+F.goalDepth)],[x,F.goalHeight,s*(F.z+F.goalDepth)],[x,F.goalHeight,s*F.z]],.025,frame);
    box(arena,[F.goalWidth,.06,.2],[0,.035,s*F.z],material(0xffffff));
  }
  // Quarter-pipe mesh: exactly the same samples build the Rapier ramp colliders.
  const rampMat=material(0x365b34,.1,.85);
  for(const axis of ['x','z'])for(const sign of [-1,1]){
    const lengths=axis==='x'?[[-F.z+F.corner,F.z-F.corner]]:[[-F.x+F.corner,-F.goalWidth/2],[F.goalWidth/2,F.x-F.corner]];
    for(const [start,end] of lengths){const pos=[],idx=[];for(let i=0;i<=16;i++){const a=i/16*Math.PI/2,d=F.ramp*Math.sin(a),y=F.ramp*(1-Math.cos(a));for(const l of [start,end])pos.push(...(axis==='x'?[sign*(F.x-F.ramp+d),y,l]:[l,y,sign*(F.z-F.ramp+d)]));}for(let i=0;i<16;i++){const j=i*2;idx.push(j,j+1,j+2,j+1,j+3,j+2);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();const m=new T.Mesh(geo,rampMat.clone());m.material.side=T.DoubleSide;m.receiveShadow=true;arena.add(m);}
  }
  // Three stacked, continuous seating bowls and luminous ribbon boards.
  for(const sx of[-1,1])for(const sz of[-1,1]){const {vertices,indices}=cornerRamp(sx,sz),geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(vertices,3));geo.setIndex(new T.BufferAttribute(indices,1));geo.computeVertexNormals();const m=new T.Mesh(geo,rampMat.clone());m.material.side=T.DoubleSide;m.receiveShadow=true;arena.add(m);}
  const seatColors=[0x376c91,0x898875,0xb4a86e,0x699398,0x355174,0xb7683e,0x547362,0x78675e];
  const seats=new T.InstancedMesh(new T.SphereGeometry(.43,5,4),material(0xffffff,.05,.85),24000);let count=0;const dummy=new T.Object3D(),color=new T.Color();
  for(let tier=0;tier<3;tier++){
    const base=8+tier*10,rx=F.x+9+tier*7,rz=F.z+25+tier*7;
    for(const s of [-1,1]){
      box(arena,[11,3,F.z*2+49],[s*(rx+1),base-2,0],dark);
      box(arena,[F.x*2+28,3,11],[0,base-2,s*(rz+1)],dark);
      box(arena,[.5,7,F.z*2+49],[s*(rx+6),base+2,0],dark);
      box(arena,[F.x*2+28,7,.5],[0,base+2,s*(rz+6)],dark);
      box(arena,[9,1,F.z*2+48],[s*rx,base-1,0],concrete);
      box(arena,[F.x*2+24,1,9],[0,base-1,s*rz],concrete);
      const sideLabel=labelTexture(tier===1?'CHAMPIONS FIELD   /   ROCKET LEAGUE   /   CHAMPIONS FIELD':'ROCKET LEAGUE     ◇     CHAMPIONS FIELD',tier===1?'#bfe2ff':'#c2cee0','#101e36',2048,128);
      const sm=new T.MeshBasicMaterial({map:sideLabel});
      const board=new T.Mesh(new T.PlaneGeometry(F.z*1.8,2),sm);board.position.set(s*(rx-4.6),base,0);board.rotation.y=-s*Math.PI/2;arena.add(board);
      box(arena,[.16,.18,F.z*2+40],[s*(rx-4.7),base-1.1,0],glow(tier===1?0x85b5dc:0x507495,.8));
      box(arena,[F.x*2+16,.18,.16],[0,base-1.1,s*(rz-4.7)],glow(s<0?ORANGE:BLUE,.8));
      for(let row=0;row<5;row++){
        box(arena,[1.8,.9,F.z*2+40],[s*(rx-3+row*1.7),base+row*.9-.5,0],concrete);
        box(arena,[F.x*2+20,.9,1.8],[0,base+row*.9-.5,s*(rz-3+row*1.7)],concrete);
        for(let z=-F.z-18;z<F.z+18;z+=1.75){dummy.position.set(s*(rx-3+row*1.7),base+row*.9,z);dummy.rotation.set(0,-s*Math.PI/2,0);dummy.updateMatrix();seats.setMatrixAt(count,dummy.matrix);color.setHex(seatColors[(count*13+row*3)%seatColors.length]);seats.setColorAt(count++,color);}
        for(let x=-F.x-9;x<F.x+9;x+=1.75){dummy.position.set(x,base+row*.9,s*(rz-3+row*1.7));dummy.rotation.set(0,s<0?0:Math.PI,0);dummy.updateMatrix();seats.setMatrixAt(count,dummy.matrix);color.setHex(seatColors[(count*7+row)%seatColors.length]);seats.setColorAt(count++,color);}
      }
    }
    for(const sx of [-1,1])for(const sz of [-1,1]){
      const cx=sx*(F.x-10),cz=sz*(F.z+5),r=19+tier*7;
      const points=[];for(let n=0;n<=20;n++){const a=n/20*Math.PI/2;points.push([cx+sx*r*Math.cos(a),base-1,cz+sz*r*Math.sin(a)]);}tube(arena,points,.75,concrete);tube(arena,points.map(p=>[p[0],p[1]+.6,p[2]]),.07,glow(sz<0?ORANGE:BLUE,1.2));
      for(let row=0;row<5;row++){
        const rr=r+row*1.7,steps=Math.ceil(rr*Math.PI/2/1.6);
        tube(arena,points.map((p,n)=>{const a=n/20*Math.PI/2;return[cx+sx*rr*Math.cos(a),base+row*.9-.45,cz+sz*rr*Math.sin(a)];}),.8,concrete);
        for(let n=0;n<=steps;n++){const a=n/steps*Math.PI/2;dummy.position.set(cx+sx*rr*Math.cos(a),base+row*.9+.1,cz+sz*rr*Math.sin(a));dummy.rotation.set(0,a,0);dummy.updateMatrix();seats.setMatrixAt(count,dummy.matrix);color.setHex(seatColors[count%seatColors.length]);seats.setColorAt(count++,color);}
      }
    }
  }
  seats.count=count;arena.add(seats);
  // Low advertising boards and steel mullions visually anchor the transparent cage.
  const adMaterial=new T.MeshBasicMaterial({map:labelTexture('ROCKET LEAGUE    ◇    RLCS    ◇    ROCKET LEAGUE','#bdcfe0','#142337',2048,128)});
  for(const side of[-1,1])for(let z=-90;z<=90;z+=15){
    const ad=new T.Mesh(new T.PlaneGeometry(14,1.15),adMaterial);ad.position.set(side*(F.x-.15),3,z);ad.rotation.y=-side*Math.PI/2;arena.add(ad);
    cylinder(arena,.055,34,[side*(F.x+.2),19,z],steel);
  }
  const flagColors=['#bb493c','#4874b4','#d9a744','#51836a','#a4b4d7','#8b4557'];
  for(const s of[-1,1])for(let n=0;n<16;n++){
    const map=canvasTexture(96,64,c=>{c.fillStyle=flagColors[n%6];c.fillRect(0,0,96,64);c.fillStyle='#dfe3d3';if(n%2)c.fillRect(0,24,96,16);else{c.fillRect(32,0,15,64);c.fillRect(0,25,96,13);}});
    const flag=new T.Mesh(new T.PlaneGeometry(2.4,1.6),new T.MeshStandardMaterial({map,side:T.DoubleSide}));flag.position.set(s*(F.x+5),18,-98+n*13);flag.rotation.y=-s*Math.PI/2;arena.add(flag);
  }
  // Stadium roof, structural uprights, hanging banners, and banks of floodlights.
  for(const s of [-1,1]){
    box(arena,[24,1.2,F.z*2+89],[s*(F.x+24),40,0],dark);
    box(arena,[F.x*2+26,1.2,24],[0,40,s*(F.z+40)],dark);
    for(let z=-F.z-25;z<=F.z+25;z+=24){
      cylinder(arena,.35,45,[s*(F.x+33),20,z],steel);
      tube(arena,[[s*(F.x+33),39,z],[s*(F.x+4),39,z],[s*(F.x+33),35,z]],.18,steel);
      box(arena,[.22,.15,18],[s*(F.x+12),39,z],glow(0xb9d9ff,2));
      const lightBank=box(arena,[2.3,1,8],[s*(F.x+6),37,z],steel);lightBank.rotation.z=s*.3;
      for(let n=0;n<6;n++)box(arena,[2,.1,.72],[s*(F.x+5.8),36.4,z-3+n*1.2],glow(0xf0f7ff,4));
    }
    for(let x=-64;x<=64;x+=16){
      const banner=new T.Mesh(new T.PlaneGeometry(5,9),new T.MeshStandardMaterial({map:labelTexture('RLCS','#d9c898','#122039',256,512),side:T.DoubleSide}));banner.position.set(x,31,s*(F.z+30));banner.rotation.y=s<0?0:Math.PI;arena.add(banner);
    }
    const screen=new T.Mesh(new T.PlaneGeometry(28,12),new T.MeshBasicMaterial({map:labelTexture('ROCKET LEAGUE','#e5f2ff','#142d4d',1024,512)}));screen.position.set(0,29,s*(F.z+32));screen.rotation.y=s<0?0:Math.PI;arena.add(screen);
  }
  // Monument silhouette above the far seating bowl.
  const gold=material(0xb3a272,.78,.3);
  for(const s of [-1,1]){cylinder(arena,6,2,[0,43,s*(F.z+40)],gold);cylinder(arena,1.6,8,[0,48,s*(F.z+40)],gold,2.8);const shield=new T.Mesh(new T.IcosahedronGeometry(6,0),gold);shield.scale.set(1,1.2,.45);shield.position.set(0,56,s*(F.z+40));arena.add(shield);}
  const pads=PAD_POSITIONS.map(p=>{
    const group=new T.Group();group.position.set(p.x,.08,p.z);arena.add(group);
    cylinder(group,p.large?1.5:.8,.1,[0,0,0],material(0x24272a,.8,.3));
    const ring=new T.Mesh(new T.TorusGeometry(p.large?1.18:.56,.055,6,32),glow(0xffbb41,2.2));ring.rotation.x=Math.PI/2;ring.position.y=.075;group.add(ring);
    const core=cylinder(group,p.large?.72:.28,.1,[0,.08,0],glow(0xffd66a,2));
    if(p.large){const orb=new T.Mesh(new T.OctahedronGeometry(.42),glow(0xffc247,2.4));orb.position.y=.9;group.add(orb);core.userData.orb=orb;}
    return {...p,group,ring,core,cooldown:0};
  });
  return {arena,pads};
}
