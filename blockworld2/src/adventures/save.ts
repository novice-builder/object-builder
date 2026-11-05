import { WorldStore, type WorldRecord } from '../persistence/store';
import { type Snapshot, encode } from '../persistence/schema';
import { DEFINITIONS } from './assets';
import { WORLDS, type Placement, type SceneId } from './landscape';
export interface AdventureData {version:1;scene:SceneId;objects:Placement[];discoveries:string[]}
export interface AdventurePose {x:number;z:number;yaw:number;pitch:number}
export const DATABASE='blockworld-adventures-assets-v1';
export function validateAdventure(s:Snapshot):AdventureData{
 const a=s.world.adventure as AdventureData;
 if(!a||a.version!==1||!WORLDS.some(w=>w.id===a.scene)||!Array.isArray(a.objects)||a.objects.length>200||!Array.isArray(a.discoveries)||a.discoveries.length>50||a.discoveries.some(d=>typeof d!=='string'||d.length>80))throw Error('This is not a supported Adventures preview backup. Existing saves are unchanged.');
 const ids=new Set<string>();
 for(const o of a.objects){if(!o||typeof o.id!=='string'||o.id.length>80||ids.has(o.id)||!DEFINITIONS.has(o.asset)||![o.x,o.z,o.yaw,o.scale].every(Number.isFinite)||Math.abs(o.x)>84||Math.abs(o.z)>84||o.scale<.2||o.scale>14)throw Error('Invalid imported object. Existing saves are unchanged.');ids.add(o.id);}
 if(Math.abs(s.player.x)>84||Math.abs(s.player.z)>84)throw Error('Player outside the preview boundary.');
 return structuredClone(a);
}
export function makeSnapshot(data:AdventureData,pose:AdventurePose):Snapshot{return {schema:3,template:'blank',world:{blocks:[],doors:{},layout:1,adventure:structuredClone(data)},player:{...pose,y:0},preferences:{selected:'hand',avatar:'explorer',camera:'third'}};}
export class AdventureSession {
 store!:WorldStore;current:WorldRecord|null=null;blocked=false;busy=0;
 private queue:Promise<unknown>=Promise.resolve();private last='';
 constructor(readonly capture:()=>Snapshot,readonly apply:(snapshot:Snapshot)=>void,readonly status:(text:string,error?:boolean)=>void,readonly pause:(busy:boolean)=>void){}
 private serial<T>(operation:()=>Promise<T>):Promise<T>{const job=this.queue.then(operation);this.queue=job.catch(()=>{});return job;}
 async init(){this.store=await WorldStore.open(DATABASE);const list=await this.store.list(),id=await this.store.last();let record=list.find(w=>w.id===id)||list[0];if(!record){const w=WORLDS[0];record=await this.store.create(w.name,makeSnapshot({version:1,scene:w.id,objects:[],discoveries:[]},{...w.spawn,yaw:w.yaw,pitch:.47}));}await this.open(record.id);}
 private async flush(){if(!this.current||!this.store)return;if(this.blocked)throw Error('Saving is paused. Export your work or save a new copy.');const owner=this.current,snapshot=this.capture();validateAdventure(snapshot);const hash=encode(snapshot).json;if(hash===this.last)return;this.status('Saving…');try{const saved=await this.store.save(owner.id,owner.revision,snapshot);if(this.current?.id===owner.id){this.current=saved;this.last=hash;}this.status('Saved on this device');}catch(e){this.blocked=true;this.status(String(e),true);throw e;}}
 save(){return this.serial(()=>this.flush());}
 private change<T>(operation:()=>Promise<T>){this.busy++;this.pause(true);return this.serial(operation).finally(()=>{if(--this.busy===0)this.pause(false);});}
 open(id:string){return this.change(async()=>{await this.flush();const loaded=await this.store.load(id);validateAdventure(loaded.snapshot);await this.flush();this.apply(loaded.snapshot);this.current=loaded.record;this.last=encode(loaded.snapshot).json;this.blocked=loaded.recovered;await this.store.select(id);this.status(loaded.recovered?'An older checkpoint was recovered. Export it or save a new copy before continuing.':'Saved on this device',loaded.recovered);});}
 create(scene:SceneId){return this.change(async()=>{await this.flush();const w=WORLDS.find(w=>w.id===scene)!;const snapshot=makeSnapshot({version:1,scene,objects:[],discoveries:[]},{...w.spawn,yaw:w.yaw,pitch:.47});const record=await this.store.create(w.name,snapshot);this.apply(snapshot);this.current=record;this.last=encode(snapshot).json;await this.store.select(record.id);this.status('Saved on this device');return record;});}
 import(text:string){return this.change(async()=>{await this.flush();if(text.length>12_000_000)throw Error('Backup exceeds 12 MB');const data=JSON.parse(text);if(data.format!=='blockworld2'||data.version!==1)throw Error('Use an Adventures .bw2 backup. Original game backups belong in the original game.');const {decode}=await import('../persistence/schema');const snapshot=decode(data.checkpoint);validateAdventure(snapshot);const record=await this.store.create(typeof data.name==='string'?data.name:'Imported adventure',snapshot);this.apply(snapshot);this.current=record;this.last=encode(snapshot).json;await this.store.select(record.id);this.status('Backup imported as a new world');});}
 export(){return this.store.export(this.current||({name:'Unsaved adventure'} as WorldRecord),this.capture());}
 recover(){return this.change(async()=>{const snapshot=this.capture();validateAdventure(snapshot);const record=await this.store.create(`${this.current?.name||'Adventure'} recovered`,snapshot);await this.store.select(record.id);this.current=record;this.last=encode(snapshot).json;this.blocked=false;this.status('Recovered copy saved');});}
}
