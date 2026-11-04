import * as T from 'three';import {addSwingDoor,addGarage} from '../legacy06/buildings-06.js';import {batchStaticWorld} from '../legacy06/world-render.js';import {batchDoorLeaves} from '../legacy06/door-render.js';
/** Original small authored town; all visible doorways lead to furnished space. */
export function makeHomeSquare(scene:T.Group){
  const solids:any[]=[],doors:any[]=[],rooms:any[]=[],houses:any[]=[];const cube=new T.BoxGeometry(1,1,1),materials=new Map<number,T.MeshLambertMaterial>();
  const material=(color:number)=>{if(!materials.has(color))materials.set(color,new T.MeshLambertMaterial({color}));return materials.get(color)!;};
  function box(x:number,y:number,z:number,w:number,h:number,d:number,color:number,solid=false){const mesh=new T.Mesh(cube,material(color));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);scene.add(mesh);if(solid)solids.push({minX:x-w/2,maxX:x+w/2,minY:y-h/2,maxY:y+h/2,minZ:z-d/2,maxZ:z+d/2});return mesh;}
  box(0,-.1,0,500,.2,500,0xa5c68b);for(const z of [-36,4,36])box(0,.012,z,84,.024,6,0x829797);for(const x of [-40,8,40])box(x,.014,0,6,.028,78,0x829797);for(let x=-36;x<=36;x+=5)box(x,.03,4,2,.02,.14,0xffedb5);
  for(const [x,z] of [[-20,-12],[-5,-21],[24,-20],[-22,21]]){const h={id:houses.length===0?'home':['cafe','library','workshop'][houses.length-1],x,z,w:12,d:10,angle:houses.length===3?Math.PI:0,wall:[0xf0c99b,0xe8b7a8,0xb8ccbd,0xd4c8a4][houses.length],roof:0x4f7d79};houses.push(h);const c=Math.cos(h.angle),s=Math.sin(h.angle),local=(lx:number,lz:number)=>({x:x+lx*c+lz*s,z:z-lx*s+lz*c});const put=(lx:number,y:number,lz:number,w:number,hh:number,d:number,color:number,solid=false)=>{const p=local(lx,lz);return box(p.x,y,p.z,w,hh,d,color,solid);};
    put(0,.025,0,12,.05,10,0xe6d2ac);put(-6,1.6,0,.22,3.2,10,h.wall,true);put(6,1.6,0,.22,3.2,10,h.wall,true);put(0,1.6,-5,12,3.2,.22,h.wall,true);
    put(-4.05,1.6,5,3.9,3.2,.22,h.wall,true);put(2.65,1.6,5,6.7,3.2,.22,h.wall,true);put(-1.4,2.77,5,1.4,.86,.22,h.wall,true);put(0,3.27,0,12.8,.2,10.8,h.roof,true);
    // Windows are visibly framed panes; interiors remain clear and distinct.
    for(const lx of [1.5,4]){put(lx,1.75,5.15,1.6,1.2,.08,0x90bec6);put(lx,1.75,5.21,.06,1.3,.08,0xfff1d5);put(lx,2.35,5.21,1.7,.08,.08,0xfff1d5);}
    addSwingDoor({scene,material,doors,h,local});rooms.push({id:h.id,x,z,y:0});
    const table=(lx:number,lz:number)=>{put(lx,.72,lz,1.6,.14,1,0xaf8055,true);for(const dx of [-.65,.65])for(const dz of [-.35,.35])put(lx+dx,.34,lz+dz,.1,.68,.1,0x856a51);};
    table(2,0);put(2,.36,1.3,1,.72,.65,0x97b49a,true);put(2,.8,1.6,1,.3,.12,0x97b49a);
    if(h.id==='home'){put(-3,.32,-2,2.4,.64,3,0xb78f69,true);put(-3,.72,-2,2.3,.2,2.9,0xf1ca8c);put(-3,.88,-3,1.8,.25,.6,0xfff6df);put(3,.7,-3,3,1.4,.7,0x81a49c,true);}
    if(h.id==='cafe'){put(-3,.7,-2,3.5,1.4,1,0xbf8d66,true);put(-3,1.45,-2,3.7,.1,1.1,0xffecd0);table(2,-3);}
    if(h.id==='library'){for(const lx of [-4,0,4]){put(lx,1.1,-3,2.3,2.2,.5,0xb38a62,true);for(let i=0;i<5;i++)put(lx-.8+i*.38,1.45,-2.69,.25,.7,.12,[0xde996e,0x78a299,0xe0c373][i%3]);}}
    if(h.id==='workshop'){put(-3,.85,-2,3,1.7,1.2,0xa8b1a6,true);put(3,.5,-3,2,1,1.5,0xe3b568,true);}
    if(h.id==='home')addGarage({scene,material,doors,h,put,local});
  }
  // Garden furniture, trees, square planters and a decorative duck pond.
  for(const [x,z] of [[-34,15],[-10,30],[28,7],[30,31],[-32,-27],[13,-32],[34,-7],[-3,15]]){box(x,1,z,.35,2,.35,0x9a7856,true);box(x,2.5,z,3.1,2.5,3.1,0x679b78);}
  for(const [x,z] of [[17,12],[25,12]]){box(x,.42,z,2.5,.16,.8,0xb28b62,true);box(x,.75,z+.36,2.5,.55,.12,0xb28b62);}
  box(30,.03,25,10,.04,8,0x82bfca);box(15,.3,22,2,.6,2,0xd3ac7e,true);box(15,.7,22,1.8,.3,1.8,0x93ad77);
  const ground=new T.Mesh(new T.PlaneGeometry(500,500),new T.MeshBasicMaterial({visible:false}));ground.rotation.x=-Math.PI/2;scene.add(ground);ground.updateMatrixWorld();const doorRender=batchDoorLeaves(doors);const staticRender=batchStaticWorld(scene,new Set([...doors.map(d=>d.pivot),ground]));
  return {ground,solids,doors,houses,rooms,roads:[],doorRender,staticRender,landmarks:[{name:'Home',icon:'⌂',x:-20,z:0},{name:'Square',icon:'☀',x:18,z:7},{name:'Library',icon:'📚',x:22.6,z:-10},{name:'Workshop',icon:'🛠',x:-20.6,z:13},{name:'Garden',icon:'🌷',x:22,z:20},{name:'Garage',icon:'🚗',x:-28,z:1}]};
}
