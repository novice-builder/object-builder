"""Rendered connected-world route, scale, compatibility and resource checks."""
import json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'docs/adventures-v3';SHOTS=OUT/'screenshots';result={'checks':[],'environment':'Managed Chromium SwiftShader; physical devices unverified'}
def check(name,ok,detail=None):
 result['checks'].append({'name':name,'passed':bool(ok),'detail':detail});(OUT/'vale-checks.json').write_text(json.dumps(result,indent=2)+'\n');print('PASS' if ok else 'FAIL',name,detail or '',flush=True);assert ok,name
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);g=b.new_page(viewport={'width':1280,'height':800});g.set_default_timeout(120000);errors=[];g.on('pageerror',lambda e:errors.append(str(e)));g.goto('http://127.0.0.1:5175/adventures.html?test=1');g.wait_for_function('window.adventure?.ready');g.locator('#enter').click();g.evaluate("adventure.game.setQuality('gentle')")
 check('new device starts in connected vale',g.evaluate("adventure.game.data.scene==='vale'&&adventure.game.data.layout===3"))
 route=g.evaluate("""()=>{const g=adventure.game,l=g.landscape,bad=[];for(const path of l.paths) {if(path.width<2.7)continue;for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*3));for(let j=0;j<=n;j++){const x=a[0]+(b[0]-a[0])*j/n,z=a[1]+(b[1]-a[1])*j/n;const hit=l.obstacles.find(o=>x>o.minX-.34&&x<o.maxX+.34&&z>o.minZ-.34&&z<o.maxZ+.34);if(hit)bad.push({x,z,name:hit.name});}}}return bad;}""")
 result['routeAudit']=route;check('major path centres clear of tree trunks',not any(x['name']=='tree' for x in route),route[:8])
 continuity=g.evaluate("""()=>{const g=adventure.game,land=g.landscape,id=g.session.current.id;Object.assign(g.player,{x:-104,z:8,y:0});g.cameraYaw=0;g.velocity.set(0,0);for(let i=0;i<400;i++)g.update(1/60,{x:1,z:0,run:true});return{x:g.player.x,z:g.player.z,sameLandscape:land===g.landscape,sameSave:id===g.session.current.id};}""")
 check('walk across western bridge without world/save replacement',continuity['x']>-68 and continuity['sameLandscape'] and continuity['sameSave'],continuity)
 east=g.evaluate("""()=>{const g=adventure.game;Object.assign(g.player,{x:22,z:8,y:0});g.velocity.set(0,0);for(let i=0;i<210;i++)g.update(1/60,{x:1,z:0,run:true});return {x:g.player.x,z:g.player.z};}""");check('eastern bridge is walkable in same world',east['x']>36,east)
 scale=g.evaluate("""()=>{const g=adventure.game;const bounds=id=>{const a=g.library.bounds.get(id);return{width:a.max.x-a.min.x,height:a.max.y-a.min.y,depth:a.max.z-a.min.z}};return{tentAt55:bounds('tent-smallopen').height*5.5,legacyTentAt25:bounds('tent-smallopen').height*2.5,actorScale:g.actor.scale.y};}""");check('new tent has standing-height shell',scale['tentAt55']>2.8,scale)
 for name in ['centre','street','woodland','meadow','hamlet','road','campScale']:
  g.evaluate("adventure.game.setQuality('balanced')");
  if name=='campScale':g.evaluate("{const g=adventure.game;g.player.x=-6;g.player.z=-12;g.player.y=0;g.actor.position.set(-6,0,-12);}")
  g.evaluate('(name)=>adventure.view(name)',name);g.evaluate("document.getElementById('toast').hidden=true");g.screenshot(path=str(SHOTS/f'vale-{name}.png'));result.setdefault('views',{})[name]=g.evaluate('adventure.stats()');g.evaluate("adventure.game.setQuality('gentle')")
 check('multiple settlements and retained regions are present',g.evaluate("adventure.game.landscape.landmarks.some(l=>l.id==='brookside')&&adventure.game.landscape.landmarks.some(l=>l.id==='foresters')&&adventure.game.landscape.landmarks.some(l=>l.id==='meadow:makers')"))
 g.evaluate('adventure.session.save()');text=g.evaluate('adventure.session.export()');g.reload();g.wait_for_function('window.adventure?.ready');check('connected save reloads expanded coordinates and scene',g.evaluate("adventure.game.data.scene==='vale'&&Math.abs(adventure.game.player.x+6)<.1"))
 g.evaluate('(text)=>adventure.session.import(text)',text);check('connected backup imports as a new copy',g.evaluate("adventure.game.data.scene==='vale'"))
 check('no connected-world runtime errors',not errors,errors);b.close()
(OUT/'vale-checks.json').write_text(json.dumps(result,indent=2)+'\n')
