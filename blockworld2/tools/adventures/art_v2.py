"""Compare preserved preview-01 layouts with the new scenery and capture real renders."""
import json,pathlib,hashlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'docs/adventures-v2';SHOTS=OUT/'screenshots';SHOTS.mkdir(parents=True,exist_ok=True)
results={'checks':[],'views':{},'environment':'Managed Chromium / SwiftShader; physical devices and Safari unverified.'}
def check(name,value,detail=None):
 assert value,(name,detail);results['checks'].append({'name':name,'passed':True,'detail':detail});print('PASS',name,flush=True)
def signature(page):return page.evaluate("""()=>{const g=adventure.game;return {obstacles:g.landscape.obstacles,paths:g.landscape.paths,landmarks:g.landscape.landmarks,objects:g.data.objects,vertices:g.landscape.group.children.filter(c=>c.geometry&&!c.isInstancedMesh).map(c=>({positions:Array.from(c.geometry.attributes.position.array),indices:Array.from(c.geometry.index?.array||[])}))};}""")
with sync_playwright()as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 old=browser.new_page(viewport={'width':1280,'height':800});old.set_default_timeout(60000);old.goto('http://127.0.0.1:5177/adventures.html?test=1');old.wait_for_function('window.adventure?.ready');old.locator('#enter').click();old.evaluate("adventure.game.setQuality('gentle')")
 current=browser.new_page(viewport={'width':1280,'height':800});current.set_default_timeout(60000);errors=[];current.on('pageerror',lambda e:errors.append(str(e)));current.goto('http://127.0.0.1:5175/adventures.html?test=1');current.wait_for_function('window.adventure?.ready');current.locator('#enter').click();current.evaluate("adventure.game.setQuality('gentle')")
 for scene in ['village','woodland','meadow']:
  old.evaluate('(scene)=>adventure.session.create(scene)',scene)
  if scene=='meadow':old.evaluate("adventure.game.data.objects.push({id:'retained-cottage-supplies',asset:'barrel',x:12,z:20,yaw:.7,scale:4});adventure.game.renderObjects()")
  baseline=signature(old);backup=old.evaluate('adventure.session.export()');current.evaluate('(text)=>adventure.session.import(text)',backup)
  check(scene+' preview-01 geometry, collisions and saved objects preserved',baseline==signature(current))
  check(scene+' imported old record uses layout 1',current.evaluate('adventure.game.data.layout===1'))
  if scene=='woodland':old.evaluate("adventure.game.setQuality('balanced');adventure.view('centre')");old.screenshot(path=str(SHOTS/'woodland-before.png'))
  current.evaluate('(scene)=>adventure.session.create(scene)',scene);check(scene+' fresh record uses layout 2',current.evaluate('adventure.game.data.layout===2'))
  if scene!='meadow':
   bad=current.evaluate("""()=>{const g=adventure.game,bad=[];for(const p of g.landscape.paths)for(let i=1;i<p.points.length;i++){const a=p.points[i-1],b=p.points[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*3));for(let k=0;k<=n;k++){const x=a[0]+(b[0]-a[0])*k/n,z=a[1]+(b[1]-a[1])*k/n;if(Math.abs(x-(30+Math.sin(z*.055)*2.5))<2.65&&Math.abs(z-8)>2)bad.push({x,z});}}return bad;}""")
   check(scene+' new trails stay on dry banks',not bad,bad[:4])
  current.evaluate("adventure.game.setQuality('balanced');adventure.view('centre')");current.screenshot(path=str(SHOTS/f'{scene}-after.png'));results['views'][scene]=current.evaluate('adventure.stats()');current.evaluate("adventure.game.setQuality('gentle')")
 check('no runtime errors in compatibility/art pass',not errors,errors)
 old.close();current.close();browser.close()
(OUT/'art-checks.json').write_text(json.dumps(results,indent=2)+'\n');print('CHECKS',len(results['checks']))
