"""Real Chromium map navigation and touch checks; no physical/Safari claim."""
import json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'docs/adventures-v3';SHOTS=OUT/'screenshots';result={'checks':[],'environment':'Managed Chromium/SwiftShader, emulated phone and tablet'}
def check(name,ok,detail=None):
 result['checks'].append({'name':name,'passed':bool(ok),'detail':detail});(OUT/'map-checks.json').write_text(json.dumps(result,indent=2)+'\n');print('PASS' if ok else 'FAIL',name,detail or '',flush=True);assert ok,name
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);errors=[]
 for name,size in [('desktop',{'width':1280,'height':800}),('phone',{'width':390,'height':844}),('phone-landscape',{'width':844,'height':390}),('tablet',{'width':1024,'height':768})]:
  ctx=b.new_context(viewport=size,is_mobile=name!='desktop',has_touch=True,device_scale_factor=1);g=ctx.new_page();g.set_default_timeout(120000);g.on('pageerror',lambda e:errors.append(str(e)));g.goto('http://127.0.0.1:5175/adventures.html?test=1');g.wait_for_function('window.adventure?.ready');g.locator('#enter').click();g.evaluate("adventure.game.setQuality('gentle')");g.wait_for_function('document.getElementById("miniCanvas").width>10')
  check(name+' compact minimap fits and clears HUD',g.evaluate("""()=>{const a=document.getElementById('minimap').getBoundingClientRect(),h=document.getElementById('hud').getBoundingClientRect();return a.right<=innerWidth&&a.bottom<innerHeight-120&&a.top>=h.bottom&&a.width<=160;}"""))
  g.screenshot(path=str(SHOTS/f'map-{name}-mini.png'));g.locator('#minimap').click();g.wait_for_selector('#mapOverlay:visible');g.wait_for_function('adventure.game.worldMap.transform!==null')
  check(name+' map is made from actual world paths/building footprints',g.evaluate("{const g=adventure.game;g.worldMap.data.paths===g.landscape.paths&&g.worldMap.data.buildings.length>20&&g.worldMap.data.rivers.length===2}"))
  g.screenshot(path=str(SHOTS/f'map-{name}-full.png'));g.locator('#mapFit').click()
  frames=g.evaluate('adventure.game.renderer.info.render.frame');g.wait_for_timeout(400);check(name+' full map suspends hidden 3D rendering',g.evaluate('(n)=>adventure.game.renderer.info.render.frame===n',frames))
  old=g.evaluate('adventure.game.worldMap.transform.scale');g.locator('#mapPlus').click();check(name+' zoom button changes map scale',g.evaluate('(n)=>adventure.game.worldMap.transform.scale>n',old));g.locator('#mapFit').click()
  if name=='phone':
   r=g.locator('#fullMap').bounding_box();cd=ctx.new_cdp_session(g);cx=r['x']+r['width']/2;cy=r['y']+r['height']/2
   cd.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':cx-30,'y':cy,'id':1},{'x':cx+30,'y':cy,'id':2}]});cd.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':cx-70,'y':cy-10,'id':1},{'x':cx+70,'y':cy+10,'id':2}]});cd.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
   check('phone real two-touch pinch zoom',g.evaluate('(n)=>adventure.game.worldMap.transform.scale>n*1.5',old));g.locator('#mapFit').click()
   before=g.evaluate('adventure.game.worldMap.transform.x');g.mouse.move(cx,cy);g.mouse.down();g.mouse.move(cx+50,cy,steps=3);g.mouse.up();check('phone map drag pans without teleport',g.evaluate('(x)=>Math.abs(adventure.game.worldMap.transform.x-x)>1&&adventure.game.worldMap.open',before));g.locator('#mapFit').click()
  # Actual canvas marker hit, not a direct teleport function call.
  pt=g.evaluate("{const m=adventure.game.worldMap,d=m.data.destinations.find(d=>d.id==='meadow');m.transform.screen(d.x,d.z)}");r=g.locator('#fullMap').bounding_box();g.mouse.click(r['x']+pt['x'],r['y']+pt['y']);g.wait_for_selector('#mapOverlay',state='hidden')
  check(name+' tap meadow marker safely travels in same world',g.evaluate("adventure.game.data.scene==='vale'&&Math.hypot(adventure.game.player.x-105,adventure.game.player.z-16)<1"))
  g.locator('#minimap').click();g.locator('#mapHome').click();check(name+' Home returns to safe village start',g.evaluate("Math.hypot(adventure.game.player.x+105,adventure.game.player.z-18)<1"))
  if name=='desktop':
   g.evaluate("{const g=adventure.game;g.data.objects.push({id:'arrival-obstruction',asset:'building_home_A_blue',x:105,z:16,yaw:0,scale:12});g.renderObjects();}");g.locator('#minimap').click();g.locator('#mapDestination').select_option('meadow')
   clear=g.evaluate("""()=>{const g=adventure.game,p=g.player;return !g.obstacles().some(o=>p.x>o.minX-.42&&p.x<o.maxX+.42&&p.z>o.minZ-.42&&p.z<o.maxZ+.42)&&Math.hypot(p.x-105,p.z-16)>1;}""");check('blocked marker arrives on nearby clear ground',clear)
   check('built cottage is included on map',g.evaluate("adventure.game.worldMap.data.buildings.some(o=>o.minX<105&&o.maxX>105)"));g.locator('#minimap').click();g.keyboard.press('Escape');check('Escape closes map and releases movement',g.evaluate('!adventure.game.worldMap.open&&adventure.game.enabled()'))
  ctx.close()
 check('no map browser runtime errors',not errors,errors);b.close()
