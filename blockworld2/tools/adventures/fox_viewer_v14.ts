import * as T from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
const renderer = new T.WebGLRenderer({antialias:true});renderer.setSize(1024,768);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;document.body.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color(0xc6d9d4);scene.add(new T.HemisphereLight(0xfff6de,0x60714b,2));const sun=new T.DirectionalLight(0xfff4df,2.5);sun.position.set(-5,8,5);scene.add(sun);
const ground=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshStandardMaterial({color:0x799756,roughness:1}));ground.rotation.x=-Math.PI/2;scene.add(ground);
const camera=new T.PerspectiveCamera(42,1024/768,.02,50);camera.position.set(3,2.7,5);camera.lookAt(0,.8,0);
const loader=new GLTFLoader();
function normalize(model:T.Object3D,height:number,x:number){model.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());model.position.x-=center.x;model.position.y-=box.min.y;model.position.z-=center.z;const root=new T.Group();root.add(model);root.scale.setScalar(height/size.y);root.position.x=x;scene.add(root);return{root,sourceBounds:box,scale:root.scale.x};}
const animal=await loader.loadAsync('./Fox.glb'),player=await loader.loadAsync('./Explorer.glb');const fox=normalize(animal.scene,.62,.85),explorer=normalize(player.scene,1.7247,-.8);explorer.root.rotation.y=Math.PI;fox.root.rotation.y=-Math.PI/2;
const mixer=new T.AnimationMixer(animal.scene);let active:T.AnimationAction;
function pose(name:string,time:number){mixer.stopAllAction();const clip=T.AnimationClip.findByName(animal.animations,name)!;active=mixer.clipAction(clip);active.reset().play();mixer.setTime(time);scene.updateMatrixWorld(true);animal.scene.traverse(o=>{if(o instanceof T.SkinnedMesh){o.skeleton.update();o.computeBoundingBox();o.computeBoundingSphere();}});renderer.render(scene,camera);const b=new T.Box3().setFromObject(fox.root);return{clip:name,time,bounds:b,scale:fox.scale,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls};}
Object.assign(window,{foxPreview:{ready:true,pose,clips:animal.animations.map(a=>({name:a.name,duration:a.duration})),source:fox.sourceBounds,renderer}});pose('Survey',.5);
