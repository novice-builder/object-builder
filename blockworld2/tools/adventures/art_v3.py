"""Compare preserved layouts against Preview 02, and inspect new layout 3."""
import json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'docs/adventures-v3';OUT.mkdir(exist_ok=True);SHOTS=OUT/'screenshots';SHOTS.mkdir(exist_ok=True)
results={'environment':'Managed Chromium SwiftShader; no physical device results','checks':[]}
def check(name,ok):
 assert ok,name
 results['checks'].append({'name':name,'passed':True});print('PASS',name,flush=True)
def signature(p):
 return p.evaluate("""()=>{const g=adventure.game,l=g.landscape;return{objects:g.data.objects,obstacles:l.obstacles,paths:l.paths,landmarks:l.landmarks,meshes:l.group.children.filter(c=>c.isMesh&&!c.isInstancedMesh).map(c=>({p:Array.from(c.geometry.attributes.position.array),ix:Array.from(c.geometry.index?.array||[])}))};}""")
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);pages=[];errors=[]
 for port in [5177,5175]:
  pg=b.new_page(viewport={'width':1280,'height':800});pg.set_default_timeout(60000);pg.on('pageerror',lambda e:errors.append(str(e)));pg.add_init_script("localStorage.setItem('blockworld-adventures-controls-v2',JSON.stringify({quality:'gentle',running:false}))");pg.goto(f'http://127.0.0.1:{port}/adventures.html?test=1');pg.wait_for_function('window.adventure?.ready');pg.locator('#enter').click();pg.evaluate("window.requestAnimationFrame=()=>0;adventure.game.setQuality('gentle')");pg.wait_for_timeout(100);pages.append(pg)
 old,current=pages
 for scene in ['village','woodland','meadow']:
  for layout in [1,2]:
   old.evaluate('(s)=>adventure.session.create(s)',scene);old.evaluate("n=>{const s=adventure.snapshot();s.world.adventure.layout=n;s.world.adventure.objects=[{id:'retained-'+s.world.adventure.scene+'-'+n,asset:'barrel',x:70,z:60,yaw:.7,scale:3.25}];adventure.game.apply(s)}",layout)
   baseline=signature(old);text=old.evaluate('adventure.session.export()');current.evaluate('(text)=>adventure.session.import(text)',text)
   check(f'{scene} layout {layout} geometry, paths, collisions, landmarks and objects preserved',signature(current)==baseline)
  current.evaluate('(s)=>adventure.session.create(s)',scene);check(scene+' fresh layout 3',current.evaluate('adventure.game.data.layout===3'))
  current.evaluate("adventure.game.setQuality('balanced');adventure.view('centre')");current.screenshot(path=str(SHOTS/f'{scene}-after.png'));current.evaluate("adventure.game.setQuality('gentle')")
 check('no art/compatibility runtime errors',not errors)
 b.close()
(OUT/'art-checks.json').write_text(json.dumps(results,indent=2)+'\n')
