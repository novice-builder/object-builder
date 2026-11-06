"""Compare actual older-world footprints, foliage and entrances against immutable Preview 11."""
import json,pathlib,hashlib
from playwright.sync_api import sync_playwright
OUT=pathlib.Path(__file__).resolve().parents[2]/'docs/adventures-v12';result={'checks':[],'reference':'Accepted Preview 11 extracted on 5186; actual rendered runtime layouts 3–6.'}
def check(name,ok,detail=None):
 result['checks'].append({'name':name,'passed':bool(ok),'detail':detail});(OUT/'layout-compat.json').write_text(json.dumps(result,indent=2)+'\n');print('PASS'if ok else'FAIL',name,detail or '',flush=True);assert ok,name
with sync_playwright()as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);pages=[]
 for port in [5186,5175]:
  page=b.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);page.set_default_timeout(120000);page.goto(f'http://127.0.0.1:{port}/adventures.html?test=1');page.wait_for_function('window.adventure?.ready');page.locator('#enter').tap();page.evaluate('window.requestAnimationFrame=()=>0;adventure.game.frame=()=>{}');pages.append(page)
 for layout in [3,4,5,6]:
  values=[]
  for page in pages:
   values.append(page.evaluate('''layout=>{const g=adventure.game,s=g.snapshot();s.world.adventure={version:3,scene:'vale',layout,objects:[{id:'old-site',asset:'barrel',x:-146,z:57,yaw:.4,scale:3}],discoveries:[],rooms:{}};s.player={x:-105,y:.002,z:18,yaw:0,pitch:.47};g.apply(s);return {paths:g.landscape.paths,obstacles:g.landscape.obstacles,trees:g.landscape.trees,entrances:g.landscape.entrances,map:g.worldMap.data,stats:g.outdoorSpace.stats(),snapshot:g.snapshot().world.adventure}}''',layout))
  # Number roundoff is not suppressed: the coordinates must remain exactly stable.
  a,c=values;check(f'layout {layout} exactly retains reference scenery, paths, collision bounds, entrances, map and construction',a==c,{'referenceHash':hashlib.sha256(json.dumps(a,sort_keys=True).encode()).hexdigest(),'currentHash':hashlib.sha256(json.dumps(c,sort_keys=True).encode()).hexdigest(),'buildings':len(a['map']['buildings']),'trees':len(a['trees'])})
 for page in pages:page.close()
 b.close()
