"""Same-room/pose workload before and after bedroom furnishings; no FPS extrapolation."""
import json,pathlib
from playwright.sync_api import sync_playwright
OUT=pathlib.Path(__file__).resolve().parents[2]/'docs/adventures-v10';result={'environment':'Managed Chromium SwiftShader. Identical room dimensions/pose/camera, Gentle. No physical performance claim.','views':{},'checks':[]}
with sync_playwright()as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for phase,port in [('preview09',5182),('bedrooms',5175)]:
  g=b.new_page(viewport={'width':1024,'height':768},has_touch=True,is_mobile=True);g.set_default_timeout(120000);g.goto(f'http://127.0.0.1:{port}/adventures.html?test=1');g.wait_for_function('window.adventure?.ready');g.locator('#enter').tap();g.evaluate('window.requestAnimationFrame=()=>0');g.wait_for_timeout(100);result[phase+'StartupBytes']=g.evaluate("performance.getEntriesByType('resource').reduce((s,r)=>s+r.encodedBodySize,0)");rows={}
  for kind in ['cottage','inn']:
   rows[kind]=g.evaluate('''async kind=>{const g=adventure.game;if(g.interior)await g.leaveRoom();const e=g.landscape.entrances.find(e=>e.kind===kind);Object.assign(g.player,{x:e.x,z:e.z});await g.enterRoom(e);Object.assign(g.player,{x:0,y:3,z:-e.depth/2+.75});g.actor.position.set(g.player.x,g.player.y,g.player.z);g.cameraYaw=.55;g.cameraPitch=.8;g.cameraPosition.set(0,0,0);g.mixer.setTime(.4);g.cameraUpdate(1/60);g.renderScene();return{stats:g.stats(),programs:g.renderer.info.programs.length,objects:g.objects.length,beds:g.objects.filter(p=>p.asset==='furniture-bedsingle').length,modelCount:g.library.models.size}}''',kind)
  result['views'][phase]=rows;g.close()
 b.close()
result['checks'].append({'name':'bedroom models add no GPU texture objects in matching room views','passed':all(result['views']['bedrooms'][k]['stats']['textures']==result['views']['preview09'][k]['stats']['textures']for k in ['cottage','inn'])});result['checks'].append({'name':'two small models and code keep sampled startup growth below 50 KB','passed':result['bedroomsStartupBytes']-result['preview09StartupBytes']<50000});(OUT/'bedroom-cost.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2),flush=True);assert all(c['passed']for c in result['checks'])
