import {Game} from './app/game';
import './ui/style.css';
try {
 const game=new Game();
 if(new URLSearchParams(location.search).get('test')==='1')Object.assign(window,{bw2:{game,snapshot:()=>game.snapshot(),setPlayer:(p:any)=>Object.assign(game.player,p),simulate:(input:any,seconds:number)=>{const old=game.controls.movement;game.controls.movement=()=>input;for(let t=0;t<seconds;t+=1/60)game.update(1/60);game.controls.movement=old;},add:(b:any)=>game.commands.place(b,false)}});
 if(import.meta.env.PROD&&'serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>game.notice('Offline preparation unavailable; export a backup before closing.'));
}catch(error){const node=document.createElement('p');node.textContent=`Could not start: ${String(error)}`;document.querySelector('#app')!.append(node);console.error(error);}
