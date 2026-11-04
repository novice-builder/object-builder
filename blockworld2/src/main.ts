import * as T from 'three';
import {FixedClock} from './app/clock';
import {createRenderer} from './render/renderer';
import './ui/style.css';
document.querySelector('#app')!.innerHTML='<canvas id="world" aria-label="BlockWorld development world"></canvas><div class="brand">BLOCKWORLD <b>2.0</b><small>Development foundation</small></div><output id="status">Starting…</output>';
try {
  const view=createRenderer(document.querySelector<HTMLCanvasElement>('#world')!);
  const ground=new T.Mesh(new T.PlaneGeometry(160,160),new T.MeshLambertMaterial({color:0x9ebf83}));ground.rotation.x=-Math.PI/2;view.scene.add(ground);
  const block=new T.Mesh(new T.BoxGeometry(2,2,2),new T.MeshLambertMaterial({color:0xe9b96a}));block.position.y=1;view.scene.add(block);
  view.camera.position.set(7,5,9);view.camera.lookAt(0,1,0);
  const clock=new FixedClock();clock.reset(performance.now());
  function frame(now:number){requestAnimationFrame(frame);if(document.hidden){clock.reset(now);return;}clock.tick(now,()=>{});view.renderer.render(view.scene,view.camera);}
  requestAnimationFrame(frame);document.querySelector('#status')!.textContent='Foundation ready · no legacy storage accessed';
  if(import.meta.env.PROD&&'serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{document.querySelector('#status')!.textContent='Offline preparation unavailable; keep this tab open.';});
} catch(error){document.querySelector('#status')!.textContent=`Could not start graphics: ${String(error)}`;}
