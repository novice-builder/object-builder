"""Real source-stair keyboard/touch/Gamepad API approach, camera, fade and exact elevated return."""
import json,pathlib
from playwright.sync_api import sync_playwright
OUT=pathlib.Path(__file__).resolve().parents[2]/'docs/adventures-v11'; result={'environment':'Chromium SwiftShader phone/tablet emulation; injected browser Gamepad API. No physical device/controller tests.','checks':[]}
def check(name,ok,detail=None):
 result['checks'].append({'name':name,'passed':bool(ok),'detail':detail});(OUT/'outdoor-steps-final.json').write_text(json.dumps(result,indent=2)+'\n');print('PASS' if ok else 'FAIL',name,detail or '',flush=True);assert ok,name
with sync_playwright()as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for device,size in [('phone',{'width':390,'height':844}),('tablet',{'width':1024,'height':768})]:
  c=b.new_context(viewport=size,has_touch=True,is_mobile=True);g=c.new_page();g.set_default_timeout(120000);errors=[];g.on('pageerror',lambda e:errors.append(str(e)));g.goto('http://127.0.0.1:5175/adventures.html?test=1');g.wait_for_function('window.adventure?.ready');g.locator('#enter').tap();g.evaluate('window.requestAnimationFrame=()=>0;adventure.game.frame=()=>{}');g.wait_for_timeout(100)
  setup=g.evaluate('''()=>{const g=adventure.game;window.root=null;g.landscape.group.traverse(o=>{if(!root&&o.userData.asset==='building_home_B_green')root=o});window.flight=g.library.stepFlights.get(root.userData.asset)[0];const a=flight.treads[0],last=flight.treads.at(-1),v=g.camera.position.clone();window.start=root.localToWorld(v.set((a.minX+a.maxX)/2,0,a.front+.6/root.scale.x)).clone();window.goal=root.localToWorld(v.set((a.minX+a.maxX)/2,last.y,last.back+.45/root.scale.x)).clone();window.e=g.landscape.entrances.filter(e=>e.kind==='townhouse').sort((a,b)=>Math.hypot(a.x-start.x,a.z-start.z)-Math.hypot(b.x-start.x,b.z-start.z))[0];window.reset=()=>{Object.assign(g.player,{x:start.x,y:.002,z:start.z,vy:0,grounded:true});g.controls.clear();g.cameraYaw=root.rotation.y;g.velocity.set(0,0)};window.advance=(up)=>{const a={...g.player};let maxRise=0,last=g.player.y;for(let i=0;i<1200;i++){g.controls.pollGamepad(1/120);g.update(1/120);maxRise=Math.max(maxRise,g.player.y-last);last=g.player.y;if(Math.hypot(g.player.x-(up?goal.x:start.x),g.player.z-(up?goal.z:start.z))<.07)break;}g.velocity.set(0,0);return {from:a,p:{...g.player},maxRise,remaining:Math.hypot(g.player.x-(up?goal.x:start.x),g.player.z-(up?goal.z:start.z))}};return{key:root.userData.stepKey,start,goal,e,stats:g.outdoorSpace.stats()}}''');check(device+' actual oversized prefab has fitted mesh steps and aligned entrance',setup['key'].endswith(':8')and abs(setup['e']['z']-setup['start']['z'])<.01,setup)
  for mode in ['keyboard','touch','gamepad']:
   g.evaluate('reset()');cdp=c.new_cdp_session(g)
   for up in [True,False]:
    if mode=='keyboard':g.keyboard.down('w' if up else 's')
    if mode=='touch':
     r=g.locator('#joystick').bounding_box();x=r['x']+r['width']/2;y=r['y']+r['height']/2;cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'id':1,'x':x,'y':y}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'id':1,'x':x,'y':y+(-40 if up else 40)}]})
    if mode=='gamepad':g.evaluate('''up=>{const g=adventure.game;window.pad={index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});g.controls.pollGamepad(1/120);pad.axes[1]=up?-.85:.85}''',up)
    moved=g.evaluate('(up)=>advance(up)',up)
    if mode=='keyboard':g.keyboard.up('w' if up else 's')
    if mode=='touch':cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    if mode=='gamepad':g.evaluate('pad.axes[1]=0;adventure.game.controls.pollGamepad(1/120)')
    check(device+' '+mode+(' ascends' if up else ' descends')+' actual outdoor steps',moved['remaining']<.12 and(moved['p']['y']>1.49 if up else moved['p']['y']<.03)and moved['maxRise']<=.301,moved)
    if up and mode=='keyboard':
     camera=g.evaluate('''()=>{const g=adventure.game;g.cameraYaw=root.rotation.y;g.cameraPitch=.65;g.cameraPosition.set(0,0,0);g.cameraUpdate(1/60);g.updateContext();g.renderScene();document.getElementById('toast').hidden=true;return{actor:g.actor.visible,distance:g.camera.position.distanceTo(g.camera.position.clone().set(g.player.x,g.player.y+1.35,g.player.z)),prompt:g.entryNear?.id===e.id}}''');check(device+' elevated exterior camera and door prompt remain useful',camera['actor']and camera['distance']>8 and camera['prompt'],camera);g.screenshot(path=str(OUT/'screenshots'/f'exterior-stairs-{device}-after.png'))
     returned=g.evaluate('''async()=>{const g=adventure.game,before={...g.player};await g.enterRoom(e);const inside=g.data.inside?.id===e.id;await g.leaveRoom();return{inside,outside:!g.interior,position:Math.hypot(g.player.x-before.x,g.player.z-before.z),dy:Math.abs(g.player.y-before.y)}}''');check(device+' fade from stair threshold returns to same elevated exterior position',returned['inside']and returned['outside']and returned['position']<.01 and returned['dy']<.01,returned)
  check(device+' actual scenery stairs have no browser errors',not errors,errors);c.close()
 b.close()
