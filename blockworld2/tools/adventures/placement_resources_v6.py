"""Bounded material/geometry resources after the newly visible ghosts are repeatedly used."""
import pathlib,json
from playwright.sync_api import sync_playwright
OUT=pathlib.Path(__file__).resolve().parents[2]/'docs/adventures-v6';result={'checks':[],'environment':'Managed Chromium SwiftShader, repeated explicit previews. Resource counts only; no physical FPS or long-session/thermal claim.'}
with sync_playwright()as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);g=b.new_page(viewport={'width':640,'height':400});g.set_default_timeout(120000);g.add_init_script("localStorage.setItem('blockworld-adventures-controls-v2',JSON.stringify({quality:'gentle',running:false}))");g.goto('http://127.0.0.1:5175/adventures.html?test=1');g.wait_for_function('window.adventure?.ready');g.locator('#enter').click();g.evaluate('()=>{window.requestAnimationFrame=()=>0}');g.wait_for_timeout(100);g.evaluate('()=>{const g=adventure.game;Object.assign(g.player,{x:111,z:17,y:0});g.cameraYaw=0;g.velocity.set(0,0);g.update(1/60,{x:0,z:0,run:false});g.cameraPosition.set(0,0,0);g.cameraUpdate(1/60);g.renderScene()}');samples=[];assets=['furniture-table','furniture-chair','building_home_A_blue','tent-smallopen','tree-oak','flower-purplea']
 for cycle in range(4):
  for asset in assets:
   draws=g.evaluate('''(asset)=>{const g=adventure.game;g.beginPlacement(asset);let draws=0;g.ghost.traverse(o=>{if(o.isMesh)o.onBeforeRender=()=>draws++});g.renderScene();g.cancelEdit();g.renderScene();return draws;}''',asset);assert draws>0,asset
  samples.append(g.evaluate('({geometries:adventure.game.renderer.info.memory.geometries,textures:adventure.game.renderer.info.memory.textures,programs:adventure.game.renderer.info.programs.length})'))
 result['samples']=samples;result['assets']=assets;result['checks']=[{'name':'six representative ghost model types render in all 24 preview/cancel cycles','passed':True},{'name':'geometry texture and program counts plateau after warmup','passed':len({json.dumps(s,sort_keys=True)for s in samples[1:]})==1}];assert all(c['passed']for c in result['checks']);b.close()
(OUT/'placement-resources.json').write_text(json.dumps(result,indent=2)+'\n');print(result,flush=True)
