import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export const material=(color,metalness=.1,roughness=.5)=>new T.MeshStandardMaterial({color,metalness,roughness});
export const glow=(color,intensity=2)=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity});
export function box(parent,size,pos,mat,radius=0){const mesh=new T.Mesh(radius?new RoundedBoxGeometry(...size,2,radius):new T.BoxGeometry(...size),mat);mesh.position.set(...pos);parent.add(mesh);return mesh;}
export function cylinder(parent,radius,length,pos,mat,r2=radius){const m=new T.Mesh(new T.CylinderGeometry(r2,radius,length,16),mat);m.position.set(...pos);parent.add(m);return m;}
export function tube(parent,points,radius,mat){const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(path,Math.max(8,points.length*3),radius,6,false),mat);parent.add(m);return m;}
export function canvasTexture(w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=8;return tx;}
export function labelTexture(text,color='#fff',background='#07152b',w=1024,h=128){return canvasTexture(w,h,(ctx)=>{ctx.fillStyle=background;ctx.fillRect(0,0,w,h);ctx.fillStyle=color;ctx.font=`italic 700 ${Math.round(h*.57)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,w/2,h*.52,w*.91);});}
// Cross sections keep the sloping hood and tapered cockpit distinct from a box car.
function hull(sections,mat){const vertices=[],indices=[];sections.forEach(([z,y,w,bottom])=>vertices.push(-w,bottom,z,w,bottom,z,-w,y,z,w,y,z));for(let i=0;i<sections.length-1;i++){const a=i*4,b=a+4;indices.push(a,b,a+1,a+1,b,b+1,a+2,a+3,b+2,a+3,b+3,b+2,a,a+2,b,a+2,b+2,b,a+1,b+1,a+3,a+3,b+1,b+3);}const last=(sections.length-1)*4;indices.push(0,1,2,1,3,2,last,last+2,last+1,last+1,last+2,last+3);for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return new T.Mesh(g,mat);}
export function createCar(color){
  const group=new T.Group(),paint=material(color,.65,.27),dark=material(0x10171c,.35,.45),metal=material(0x788b94,.8,.25),glass=material(0x122833,.6,.13),white=material(0xdde9df,.5,.3);
  const chassis=hull([[-1.27,.06,.48,-.24],[-1.05,.21,.66,-.27],[.15,.26,.73,-.28],[1.13,.12,.64,-.25]],paint);group.add(chassis);
  box(group,[1.55,.2,1.75],[0,-.23,.07],dark,.07);
  box(group,[1.15,.29,.09],[0,-.005,1.14],paint,.04);
  const cab=hull([[-.52,.24,.59,.17],[-.05,.82,.45,.19],[.57,.79,.43,.2],[.89,.3,.57,.15]],glass);group.add(cab);
  box(group,[.89,.065,.59],[0,.82,.27],paint,.045);
  for(const s of [-1,1]){
    tube(group,[[s*.59,.23,-.55],[s*.45,.82,-.05],[s*.43,.8,.57],[s*.57,.23,.92]],.045,paint);
    tube(group,[[s*.49,.37,.55],[s*.57,.28,.94],[s*.61,.06,1.08]],.045,metal);
    box(group,[.105,.015,1.12],[s*.25,.225,-.66],white,.01).rotation.x=-.065;
    box(group,[.11,.015,.54],[s*.25,.862,.27],white);
    box(group,[.35,.13,.055],[s*.43,.04,-1.265],glow(0xe4f5ff,3),.025);
    box(group,[.25,.08,.055],[s*.48,.02,1.14],glow(0xff2215,2),.015);
    box(group,[.1,.29,.12],[s*.51,.28,.99],dark);
    box(group,[.05,.15,.36],[s*.81,.49,1.03],paint,.02);
    // Octane-like open wheel arches, exposed tires, and wide rear wing.
    for(const z of [-.77,.77]){
      tube(group,[[s*.83,-.1,z-.42],[s*.83,.28,z-.3],[s*.83,.36,z],[s*.83,.28,z+.31],[s*.83,-.1,z+.41]],.075,paint);
      tube(group,[[s*.42,-.16,z],[s*.79,-.22,z]],.045,metal);
      tube(group,[[s*.58,.12,z-.08],[s*.81,-.18,z+.08]],.04,metal);
    }
    const exhaust=cylinder(group,.115,.28,[s*.32,-.05,1.23],metal);exhaust.rotation.x=Math.PI/2;
    const interior=cylinder(group,.085,.285,[s*.32,-.05,1.24],dark);interior.rotation.x=Math.PI/2;
    box(group,[.05,.08,.28],[s*.76,.26,-.12],dark,.02);
  }
  box(group,[1.71,.1,.4],[0,.48,1.03],paint,.035);
  box(group,[1.28,.12,.15],[0,-.15,-1.26],metal,.035);
  box(group,[.42,.12,.03],[0,-.04,-1.35],dark,.025);
  for(let x=-.15;x<=.15;x+=.075)box(group,[.025,.08,.02],[x,-.04,-1.372],metal);
  box(group,[.46,.11,.28],[0,.26,-.58],dark,.025);
  tube(group,[[.33,.8,.45],[.36,1.28,.55]],.012,dark);
  for(let z=-.66;z<-.45;z+=.07)box(group,[.38,.016,.02],[0,.322,z],metal);
  const wheels=[];
  const tireMat=material(0x14181b,.03,.85);
  for(const x of [-.83,.83])for(const z of [-.77,.77]){
    const pivot=new T.Group();pivot.position.set(x,-.19,z);group.add(pivot);const wheel=new T.Group();pivot.add(wheel);
    const tire=new T.Mesh(new T.CylinderGeometry(.365,.365,.29,24),tireMat);tire.rotation.z=Math.PI/2;wheel.add(tire);
    for(const s of [-1,1]){
      const rim=new T.Mesh(new T.CylinderGeometry(.245,.245,.015,20),metal);rim.rotation.z=Math.PI/2;rim.position.x=s*.153;wheel.add(rim);
      const disk=new T.Mesh(new T.CylinderGeometry(.18,.18,.02,16),dark);disk.rotation.z=Math.PI/2;disk.position.x=s*.165;wheel.add(disk);
      for(let n=0;n<6;n++){const spoke=box(wheel,[.022,.055,.37],[s*.178,0,0],white,.009);spoke.rotation.x=n*Math.PI/3;}
      const hub=new T.Mesh(new T.CylinderGeometry(.065,.065,.035,12),paint);hub.rotation.z=Math.PI/2;hub.position.x=s*.18;wheel.add(hub);
    }
    for(let n=0;n<24;n++){const a=n*Math.PI/12;const tread=box(wheel,[.285,.014,.06],[0,Math.cos(a)*.366,Math.sin(a)*.366],dark);tread.rotation.x=a;}
    wheels.push({pivot,wheel,front:z<0});
  }
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  const flame=new T.Group();group.add(flame);
  for(const s of [-1,1]){
    const f=new T.Mesh(new T.ConeGeometry(.15,1.45,10),glow(0x7bcaff,4));f.rotation.x=Math.PI/2;f.position.set(s*.32,-.05,1.9);flame.add(f);
    const core=new T.Mesh(new T.ConeGeometry(.075,.8,8),glow(0xfff9cf,5));core.rotation.x=Math.PI/2;core.position.set(s*.32,-.05,1.65);flame.add(core);
  }
  flame.visible=false;return {group,wheels,flame};
}
export function createBall(radius){
  const group=new T.Group();
  const shell=new T.Mesh(new T.SphereGeometry(radius*.88,40,24),material(0x26373c,.55,.45));group.add(shell);
  // Truncated icosahedron: 12 pentagons and 20 hexagons, with recessed seams.
  const ico=new T.IcosahedronGeometry(1,0),a=ico.attributes.position.array,verts=[],faces=[];
  for(let i=0;i<a.length;i+=9){const face=[];for(let j=0;j<3;j++){const v=new T.Vector3(a[i+j*3],a[i+j*3+1],a[i+j*3+2]);let index=verts.findIndex(p=>p.distanceTo(v)<.001);if(index<0){index=verts.length;verts.push(v);}face.push(index);}faces.push(face);}
  const neighbors=verts.map(()=>new Set());faces.forEach(f=>f.forEach((v,i)=>{neighbors[v].add(f[(i+1)%3]);neighbors[v].add(f[(i+2)%3]);}));
  const edge=(i,j)=>verts[i].clone().multiplyScalar(2/3).addScaledVector(verts[j],1/3).normalize().multiplyScalar(radius);
  const panel=(points,mat)=>{const center=points.reduce((v,p)=>v.add(p),new T.Vector3()).divideScalar(points.length);const normal=center.clone().normalize(),u=points[0].clone().sub(center).normalize(),v=new T.Vector3().crossVectors(normal,u);points.sort((a,b)=>Math.atan2(a.clone().sub(center).dot(v),a.clone().sub(center).dot(u))-Math.atan2(b.clone().sub(center).dot(v),b.clone().sub(center).dot(u)));const pos=[],normals=[];for(let i=0;i<points.length;i++){for(const p of [center.clone().normalize().multiplyScalar(radius),points[i].clone().lerp(center,.055),points[(i+1)%points.length].clone().lerp(center,.055)]){pos.push(p.x,p.y,p.z);const n=p.clone().normalize();normals.push(n.x,n.y,n.z);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));group.add(new T.Mesh(g,mat));};
  const light=material(0xd7ded4,.35,.46),black=material(0x405058,.65,.38);
  faces.forEach(([i,j,k])=>panel([edge(i,j),edge(j,i),edge(j,k),edge(k,j),edge(k,i),edge(i,k)],light));
  verts.forEach((v,i)=>{panel([...neighbors[i]].map(j=>edge(i,j)),black);const diode=new T.Mesh(new T.SphereGeometry(.105,8,6),glow(0x98e4ff,2));diode.position.copy(v.clone().normalize().multiplyScalar(radius*1.003));group.add(diode);});
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return group;
}
