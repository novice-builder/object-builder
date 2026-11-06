"""Reproduce native furniture selection failure on preserved Preview 05 and verify visible cutaway picking."""
import pathlib,json
from playwright.sync_api import sync_playwright
OUT=pathlib.Path(__file__).resolve().parents[2]/'docs/adventures-v6';result={'checks':[],'environment':'Managed Chromium/SwiftShader touch emulation; chair/player setup is a fixture. Reference is extracted Preview 05, source c113ffc.'}
with sync_playwright()as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for port,phase in [(5178,'before'),(5175,'after')]:
  for name,size in [('phone',{'width':390,'height':844}),('tablet',{'width':1024,'height':768})]:
   g=b.new_page(viewport=size,has_touch=True,is_mobile=True,device_scale_factor=1);g.set_default_timeout(120000);g.add_init_script("localStorage.setItem('blockworld-adventures-controls-v2',JSON.stringify({quality:'gentle',running:false}))");g.goto(f'http://127.0.0.1:{port}/adventures.html?test=1');g.wait_for_function('window.adventure?.ready');g.locator('#enter').click();g.evaluate('()=>{window.requestAnimationFrame=()=>0}');g.wait_for_timeout(100)
   point=g.evaluate('()=>{const g=adventure.game;g.data.objects=[{id:"kept-chair",asset:"furniture-chair",x:126.5,z:-42,yaw:0,scale:2.2}];g.renderObjects();Object.assign(g.player,{x:128,y:.06,z:-40.7});g.cameraYaw=0;g.velocity.set(0,0);g.update(1/60,{x:0,z:0,run:false});g.cameraPosition.set(0,0,0);g.cameraUpdate(1/60);g.renderScene();document.getElementById("toast").hidden=true;const p=g.camera.position.clone().set(126.5,.4,-42).project(g.camera);return{x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}}');g.touchscreen.tap(point['x'],point['y']);g.evaluate('adventure.game.renderScene()');selected=g.evaluate('adventure.game.selection==="kept-chair"&&adventure.game.selectionOutline.visible');walls=g.evaluate('adventure.game.landscape.lodge.walls.length');row={'name':name+' native furniture selection through hidden facing cutaway','phase':phase,'selected':selected,'physicalWallCount':walls,'passed':selected if phase=='after'else not selected};result['checks'].append(row);print(row,flush=True);assert row['passed']and walls==5;g.screenshot(path=str(OUT/'screenshots'/f'selection-{name}-{phase}.png'));g.close()
 b.close()
(OUT/'selection-cutaway.json').write_text(json.dumps(result,indent=2)+'\n')
