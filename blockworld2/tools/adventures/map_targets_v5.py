"""Real touch tests for visible landmark names, map gestures and safe travel."""
import argparse,json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'docs/adventures-v5';SHOTS=OUT/'screenshots';parser=argparse.ArgumentParser();parser.add_argument('--phase',choices=['before','after'],required=True);a=parser.parse_args();result={'phase':a.phase,'checks':[],'environment':'Managed Chromium SwiftShader with touch viewport emulation. Physical Lenovo/iPhone/Safari remain unverified.'}
def check(name,ok,detail=None):
 result['checks'].append({'name':name,'passed':bool(ok),'detail':detail});(OUT/f'map-targets-{a.phase}.json').write_text(json.dumps(result,indent=2)+'\n');print('PASS'if ok else'REPRODUCED',name,detail or '',flush=True)
 if a.phase=='after':assert ok,name
with sync_playwright()as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for name,size in [('phone',{'width':390,'height':844}),('tablet',{'width':1024,'height':768})]:
  errors=[];g=b.new_page(viewport=size,has_touch=True,is_mobile=True,device_scale_factor=1);g.on('pageerror',lambda e:errors.append(str(e)));g.set_default_timeout(120000);g.add_init_script("localStorage.setItem('blockworld-adventures-controls-v2',JSON.stringify({quality:'gentle',running:false}))");g.goto('http://127.0.0.1:5175/adventures.html?test=1');g.wait_for_function('window.adventure?.ready');g.locator('#enter').click();g.locator('#minimap').click();g.locator('#mapFit').click()
  point=g.evaluate("""()=>{const m=adventure.game.worldMap,d=m.data.destinations.find(d=>d.id==='foresters'),p=m.transform.screen(d.x,d.z);if(m.targets){const t=m.targets.find(t=>t.destination.id===d.id),r=t.label;return{x:r.x+7,y:r.y+r.height/2,distance:Math.hypot(r.x+7-p.x,r.y+r.height/2-p.y)};}const small=innerWidth<500&&m.transform.scale<1.8;return{x:p.x-(small?20:45),y:p.y-(small?32:20),distance:Math.hypot(small?20:45,small?32:20)};}""");g.screenshot(path=str(SHOTS/f'map-{name}-{a.phase}.png'));r=g.locator('#fullMap').bounding_box();g.touchscreen.tap(r['x']+point['x'],r['y']+point['y']);g.wait_for_timeout(100)
  check(name+' visible name edge safely travels to its landmark',g.evaluate("!adventure.game.worldMap.open&&Math.hypot(adventure.game.player.x+23,adventure.game.player.z+38)<1"),point)
  if a.phase=='after':
   for zoom in [1,1.8,3]:
    g.locator('#minimap').click();g.locator('#mapFit').click();g.evaluate('(factor)=>adventure.game.worldMap.zoom(factor)',zoom)
    if zoom>1:g.evaluate('adventure.game.worldMap.transform.x=0;adventure.game.worldMap.transform.z=0;adventure.game.worldMap.drawFull()')
    geometry=g.evaluate("""()=>{const m=adventure.game.worldMap,c=m.full.getBoundingClientRect();return m.targets.map(t=>({id:t.destination.id,x:t.label.x,y:t.label.y,right:t.label.x+t.label.width,bottom:t.label.y+t.label.height,w:c.width,h:c.height}));}""");check(f'{name} labels fit viewport at zoom {zoom}',all(t['x']>=0 and t['y']>=0 and t['right']<=t['w']+.1 and t['bottom']<=t['h']+.1 for t in geometry),geometry)
    g.locator('#mapClose').click()
   # A drag ending over a landmark must not teleport, including sparse/coalesced move delivery.
   g.locator('#minimap').click();g.locator('#mapFit').click();r=g.locator('#fullMap').bounding_box();pt=g.evaluate("{const m=adventure.game.worldMap,d=m.data.destinations.find(d=>d.id==='meadow');m.transform.screen(d.x,d.z)}");cd=g.context.new_cdp_session(g);cd.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'id':99,'x':r['x']+pt['x']-40,'y':r['y']+pt['y']}]});g.wait_for_function('adventure.game.worldMap.pointers.size===1');pointer=g.evaluate('Array.from(adventure.game.worldMap.pointers.keys())[0]');g.dispatch_event('#fullMap','pointerup',{'pointerId':pointer,'clientX':r['x']+pt['x'],'clientY':r['y']+pt['y'],'pointerType':'touch'});cd.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});check(name+' release displacement cannot become accidental travel',g.evaluate('adventure.game.worldMap.open'));g.locator('#mapClose').click()
   # Genuine multitouch zoom followed by one-finger pan must never become landmark travel.
   g.locator('#minimap').click();g.locator('#mapFit').click();r=g.locator('#fullMap').bounding_box();x=r['x']+r['width']/2;y=r['y']+r['height']/2;scale=g.evaluate('adventure.game.worldMap.transform.scale')
   def touch(kind,points):
    cd.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':points});g.wait_for_timeout(50)
   touch('touchStart',[{'id':1,'x':x-40,'y':y}]);touch('touchStart',[{'id':1,'x':x-40,'y':y},{'id':2,'x':x+40,'y':y}]);touch('touchMove',[{'id':1,'x':x-70,'y':y},{'id':2,'x':x+70,'y':y}]);touch('touchEnd',[{'id':2,'x':x+70,'y':y}]);pan=g.evaluate('adventure.game.worldMap.transform.x');touch('touchMove',[{'id':1,'x':x-45,'y':y+10}]);touch('touchEnd',[])
   check(name+' pinch zoom and remaining-finger pan retain the map without travel',g.evaluate('(v)=>adventure.game.worldMap.open&&adventure.game.worldMap.transform.scale>v.scale&&Math.abs(adventure.game.worldMap.transform.x-v.pan)>1&&adventure.game.worldMap.pointers.size===0',{'scale':scale,'pan':pan}));g.locator('#mapFit').click()
   # Cancellation clears ownership; a fresh tap on a marker still works.
   touch('touchStart',[{'id':3,'x':x,'y':y}]);touch('touchCancel',[]);check(name+' cancelled map touch clears ownership',g.evaluate('adventure.game.worldMap.pointers.size===0&&adventure.game.worldMap.open'));pt=g.evaluate("{const m=adventure.game.worldMap,d=m.data.destinations.find(d=>d.id==='meadow');m.transform.screen(d.x,d.z)}");g.touchscreen.tap(r['x']+pt['x'],r['y']+pt['y']);check(name+' marker circle still safely travels after cancellation',g.evaluate('!adventure.game.worldMap.open&&Math.hypot(adventure.game.player.x-105,adventure.game.player.z-16)<1'));check(name+' no browser exceptions',not errors,errors)
  g.close()
 b.close()
