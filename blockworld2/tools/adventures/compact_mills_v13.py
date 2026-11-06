"""Walk both compact mill flights with ordinary keyboard, actual touch and standard Gamepad API input."""
import json,pathlib
from playwright.sync_api import sync_playwright
OUT=pathlib.Path(__file__).resolve().parents[2]/'docs/adventures-v13';result={'checks':[],'environment':'Managed Chromium SwiftShader, phone/tablet touch and injected standard browser Gamepad API. Physical hardware unverified.'}
def check(name,ok,detail=None):
 result['checks'].append({'name':name,'passed':bool(ok),'detail':detail});(OUT/'compact-mills.json').write_text(json.dumps(result,indent=2)+'\n');print('PASS'if ok else'FAIL',name,detail or '',flush=True);assert ok,name
with sync_playwright()as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for device,size,name in [('phone',{'width':390,'height':844},'Old Willow Windmill'),('tablet',{'width':1024,'height':768},'Alderwick Windmill')]:
  c=b.new_context(viewport=size,has_touch=True,is_mobile=True);g=c.new_page();g.set_default_timeout(120000);errors=[];g.on('pageerror',lambda e:errors.append(str(e)));g.goto('http://127.0.0.1:5175/adventures.html?test=1');g.wait_for_function('window.adventure?.ready');g.locator('#enter').tap();g.evaluate('window.requestAnimationFrame=()=>0;adventure.game.frame=()=>{}');g.wait_for_timeout(100)
  setup=g.evaluate('''name=>{const g=adventure.game,e=g.landscape.entrances.find(e=>e.name===name);Object.assign(g.player,{x:e.x,y:g.outdoorSpace.ground(e.x,e.z)+.002,z:e.z,vy:0,grounded:true});g.update(1/120,{x:0,z:0,run:false});g.updateContext();return{entry:e,version:g.data.version,id:g.session.current.id,outside:{...g.player}}}''',name);check(device+' fresh mill uses explicit version-4 compact profile and sensible 5.2m footprint',setup['version']==4 and setup['entry']['profile']=='compact-windmill'and setup['entry']['width']==5.2 and setup['entry']['depth']==5.2,setup)
  g.locator('#interact').tap();g.wait_for_function('!!adventure.game.interior&&!adventure.game.transitioning',polling=50);loaded=g.evaluate('''()=>{const g=adventure.game;return{version:g.data.version,id:g.session.current.id,flights:g.interior.solids.filter(s=>s.ramp).length,objects:g.objects.length,clear:g.roomSpace.clear(g.player),walls:g.interior.walls.length}}''');check(device+' real UI fade opens furnished octagonal room without needless copy',loaded['version']==4 and loaded['id']==setup['id']and loaded['flights']==2 and loaded['objects']==6 and loaded['clear']and loaded['walls']==8,loaded)
  cdp=c.new_cdp_session(g)
  def move(mode,x,z):
   here=g.evaluate('({x:adventure.game.player.x,z:adventure.game.player.z})');dx=x-here['x'];dz=z-here['z'];axis='x'if abs(dx)>abs(dz)else'z';direction=1 if(x-here['x']if axis=='x'else z-here['z'])>0 else-1;target=x if axis=='x'else z
   if abs(x-here['x'])<.055 and abs(z-here['z'])<.055:return g.evaluate('({...adventure.game.player})')
   g.evaluate('adventure.game.cameraYaw=0;adventure.game.controls.clear()')
   if mode=='keyboard':key=('d'if direction>0 else'a')if axis=='x'else('s'if direction>0 else'w');g.keyboard.down(key)
   elif mode=='touch':
    r=g.locator('#joystick').bounding_box();cx=r['x']+r['width']/2;cy=r['y']+r['height']/2;cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'id':1,'x':cx,'y':cy}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'id':1,'x':cx+(36*direction if axis=='x'else 0),'y':cy+(36*direction if axis=='z'else 0)}]})
   else:g.evaluate('''({axis,direction})=>{const g=adventure.game;window.pad={index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});g.controls.pollGamepad(1/120);pad.axes[axis==='x'?0:1]=direction*.85}''',{'axis':axis,'direction':direction})
   step=g.evaluate('''({axis,target})=>{const g=adventure.game;let rise=0,last=g.player.y,ok=false;for(let i=0;i<2400;i++){g.controls.pollGamepad(1/120);g.update(1/120);rise=Math.max(rise,g.player.y-last);last=g.player.y;if(Math.abs(g.player[axis]-target)<.05){ok=true;break}}g.velocity.set(0,0);return{ok,p:{...g.player},rise}}''',{'axis':axis,'target':target})
   if mode=='keyboard':g.keyboard.up(key)
   elif mode=='touch':cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
   else:g.evaluate('pad.axes=[0,0,0,0];adventure.game.controls.pollGamepad(1/120)')
   assert step['ok'],{'mode':mode,'target':{'x':x,'z':z},'step':step};assert step['rise']<=.301,step;return step['p']
  for mode in ['keyboard','touch','gamepad']:
   for x,z in [[0,2.12],[1.45,2.12],[1.45,-1.2]]:middle=move(mode,x,z)
   check(device+' '+mode+' walks the first actual flight onto the turning landing',abs(middle['y']-1.502)<.003,middle)
   if mode=='keyboard':
    g.evaluate('''()=>{const g=adventure.game;g.cameraYaw=0;g.cameraPosition.set(0,0,0);g.cameraUpdate(1/60);g.updateContext();g.renderScene();g.worldMap.update(g.mapPose(),performance.now(),true);document.getElementById('toast').hidden=true}''');g.screenshot(path=str(OUT/'screenshots'/f'compact-landing-{device}.png'))
    g.evaluate('adventure.game.session.save()');g.reload();g.wait_for_function('window.adventure?.ready');g.locator('#enter').tap();g.evaluate('window.requestAnimationFrame=()=>0;adventure.game.frame=()=>{}');mid=g.evaluate('({p:{...adventure.game.player},id:adventure.game.interior.entry.id,version:adventure.game.data.version})');check(device+' real reload retains the intermediate landing and same mill',abs(mid['p']['y']-1.502)<.003 and mid['id']==setup['entry']['id']and mid['version']==4,mid)
   for x,z in [[-.05,-1.2],[-.05,2.12],[-1.1,2.12],[-1.1,0]]:up=move(mode,x,z)
   check(device+' '+mode+' turns naturally and climbs the second flight to usable loft space',abs(up['y']-3.002)<.003,up)
   if mode=='keyboard':
    g.evaluate('''()=>{const g=adventure.game;g.cameraYaw=0;g.cameraPosition.set(0,0,0);g.cameraUpdate(1/60);g.updateContext();g.renderScene();g.worldMap.update(g.mapPose(),performance.now(),true);document.getElementById('toast').hidden=true}''');g.screenshot(path=str(OUT/'screenshots'/f'compact-loft-{device}.png'))
   for x,z in [[-1.1,2.12],[-.05,2.12],[-.05,-1.2],[1.45,-1.2],[1.45,2.12],[0,2.12],[0,1.4]]:down=move(mode,x,z)
   check(device+' '+mode+' descends both connected flights and returns to the exit floor',down['y']<.01,down)
  g.evaluate("Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[]});adventure.game.controls.pollGamepad(1/120);adventure.game.updateContext()")
  g.locator('#interact').tap();g.wait_for_function('!adventure.game.interior&&!adventure.game.transitioning',polling=50,timeout=20000);exited=g.evaluate('''()=>{const g=adventure.game;return{p:{...g.player},clear:g.outdoorSpace.clear(g.player),rooms:Object.keys(g.data.rooms).length}}''');check(device+' actual Exit UI fades to the same clear building exterior',exited['clear']and abs(exited['p']['x']-setup['outside']['x'])<.01 and abs(exited['p']['z']-setup['outside']['z'])<.01 and exited['rooms']==1,exited)
  check(device+' new compact movement and transition checks have no page exceptions',not errors,errors);c.close()
 b.close()
