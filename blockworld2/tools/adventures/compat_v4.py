"""Ensure new lodge layout is opt-in; legacy vale constructions stay in Preview 03 geometry."""
import pathlib,json
from playwright.sync_api import sync_playwright
OUT=pathlib.Path(__file__).resolve().parents[2]/'docs/adventures-v4';result={'checks':[]}
def check(name,ok):
 result['checks'].append({'name':name,'passed':bool(ok)});print('PASS'if ok else'FAIL',name,flush=True);assert ok,name
signature="""()=>{const g=adventure.game,l=g.landscape,parts=[];l.group.traverse(o=>{if(!o.isMesh)return;const attrs={};for(const [name,a] of Object.entries(o.geometry.attributes)){const bytes=new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength);let h=2166136261;for(const b of bytes)h=Math.imul(h^b,16777619);attrs[name]=[a.count,h>>>0];}let matrix=o.isInstancedMesh?Array.from(o.instanceMatrix.array):[];parts.push({attrs,indices:o.geometry.index?.count,local:Array.from(o.matrix.elements),matrix});});return{parts,obstacles:l.obstacles,paths:l.paths,landmarks:l.landmarks,objects:g.data.objects};}"""
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);pages=[]
 for port in [5176,5175]:
  pg=b.new_page(viewport={'width':640,'height':400});pg.set_default_timeout(120000);pg.add_init_script("localStorage.setItem('blockworld-adventures-controls-v2',JSON.stringify({quality:'gentle',running:false}))");pg.goto(f'http://127.0.0.1:{port}/adventures.html?test=1');pg.wait_for_function('window.adventure?.ready');pg.locator('#enter').click();pg.evaluate('window.requestAnimationFrame=()=>0');pg.wait_for_timeout(100);pages.append(pg)
 old,current=pages;old.evaluate("{const g=adventure.game;g.data.objects=[{id:'keep-lodge-site',asset:'building_home_A_blue',x:128,z:-42,yaw:.6,scale:7}];g.renderObjects();}");before=old.evaluate(signature);text=old.evaluate('adventure.session.export()');current.evaluate('(text)=>adventure.session.import(text)',text)
 check('layout-3 vale retains all geometry/paths/colliders/landmarks and site construction',current.evaluate(signature)==before)
 check('old vale import has no lodge or altered floor',current.evaluate('adventure.game.data.layout===3&&!adventure.game.landscape.lodge&&adventure.game.data.objects[0].id===\'keep-lodge-site\''))
 current.evaluate("adventure.session.create('vale')");check('fresh layout-4 vale is a separate record with actual lodge',current.evaluate('adventure.game.data.layout===4&&!!adventure.game.landscape.lodge&&adventure.game.data.objects.length===0'))
 check('new map footprint includes actual lodge roof bounds',current.evaluate("adventure.game.worldMap.data.buildings.some(b=>b.name==='building_lodge'&&b.minX<128&&b.maxX>128)"))
 b.close()
(OUT/'compat-checks.json').write_text(json.dumps(result,indent=2)+'\n')
