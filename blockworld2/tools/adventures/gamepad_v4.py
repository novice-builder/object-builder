"""Injected standard Gamepad API snapshots, not a physical Xbox/Bluetooth/device test."""
import json,pathlib
from playwright.sync_api import sync_playwright
OUT=pathlib.Path(__file__).resolve().parents[2]/'docs/adventures-v4';result={'checks':[],'environment':'Managed Chromium with injected standard-mapping Gamepad API snapshots. No physical controller, Bluetooth, Lenovo, iPhone or Safari test.'}
def check(name,ok,detail=None):
 result['checks'].append({'name':name,'passed':bool(ok),'detail':detail});(OUT/'gamepad-checks.json').write_text(json.dumps(result,indent=2)+'\n');print('PASS'if ok else'FAIL',name,detail or '',flush=True);assert ok,name
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);g=b.new_page(viewport={'width':1024,'height':768},has_touch=True,is_mobile=True);g.set_default_timeout(120000);errors=[];g.on('pageerror',lambda e:errors.append(str(e)));g.add_init_script("localStorage.setItem('blockworld-adventures-controls-v2',JSON.stringify({quality:'gentle',running:false}));window.injectedPad=null;Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.injectedPad]});");g.goto('http://127.0.0.1:5175/adventures.html?test=1');g.wait_for_function('window.adventure?.ready');g.locator('#enter').click();g.evaluate('window.requestAnimationFrame=()=>0');g.wait_for_timeout(150);g.bring_to_front()
 def tick(axes=None,buttons=None):
  return g.evaluate("""({axes,buttons})=>{window.injectedPad={index:0,mapping:'standard',connected:true,axes:axes||[0,0,0,0],buttons:Array.from({length:17},(_,i)=>({pressed:(buttons||[]).includes(i),value:(buttons||[]).includes(i)?1:0}))};adventure.game.controls.pollGamepad(.05);}""",{'axes':axes,'buttons':buttons})
 def button(n):tick(buttons=[n]);tick()
 tick();check('standard controller connects neutrally',g.evaluate('adventure.game.controls.gamepad.connected&&adventure.game.controls.movement().x===0'))
 start=g.evaluate('adventure.game.player.x');tick([1,0,0,0]);g.evaluate("{const g=adventure.game;for(let i=0;i<50;i++)g.update(1/60);}");check('left stick drives shared character movement',g.evaluate('(x)=>adventure.game.player.x>x+1',start));tick()
 yaw=g.evaluate('adventure.game.cameraYaw');tick([0,0,.7,0]);check('right stick uses existing camera orbit',g.evaluate('(n)=>Math.abs(adventure.game.cameraYaw-n)>.01',yaw));tick()
 button(10);check('left-stick click toggles persisted Run control',g.locator('#run').get_attribute('aria-pressed')=='true')
 button(9);check('Menu button opens accessible menu',g.locator('#modal').is_visible());frames=g.evaluate('adventure.game.renderer.info.render.frame');g.evaluate('{const g=adventure.game;for(let i=0;i<6;i++)g.frame(performance.now());}');check('menu polls input without submitting hidden 3D frames',g.evaluate('(n)=>adventure.game.renderer.info.render.frame===n',frames));g.locator('#controllerHelp summary').click();g.screenshot(path=str(OUT/'screenshots/controller-help.png'));check('controller mapping help is available', 'Left stick walks' in g.locator('#controllerHelp').inner_text());button(1);check('B cancels dialog and returns movement',g.evaluate('!adventure.game.modalOpen&&adventure.game.enabled()'))
 record=g.evaluate('adventure.session.current.id');button(8);check('View button opens world map',g.evaluate('adventure.game.worldMap.open'))
 transform=g.evaluate('({x:adventure.game.worldMap.transform.x,scale:adventure.game.worldMap.transform.scale})');tick([1,0,0,-.8]);check('sticks pan and zoom map without moving the player',g.evaluate('(t)=>adventure.game.worldMap.transform.x>t.x&&adventure.game.worldMap.transform.scale>t.scale',transform));tick();g.locator('#mapFit').click();g.evaluate('{const g=adventure.game;g.worldMap.update({x:g.player.x,z:g.player.z,yaw:g.actorYaw},performance.now()+100)}');g.screenshot(path=str(OUT/'screenshots/controller-map.png'))
 for _ in range(8):
  if g.evaluate('document.activeElement.id')=='mapDestination':break
  button(13)
 check('D-pad reaches landmark chooser',g.evaluate('document.activeElement.id')=='mapDestination')
 for _ in range(3):button(15)
 check('D-pad changes landmark without immediate teleport',g.locator('#mapDestination').input_value()=='meadow' and g.evaluate('adventure.game.worldMap.open'))
 button(0);check('A confirms selected safe map travel in same save',g.evaluate('(id)=>!adventure.game.worldMap.open&&Math.hypot(adventure.game.player.x-105,adventure.game.player.z-16)<1&&adventure.session.current.id===id',record))
 g.evaluate('{const g=adventure.game;g.player.x=111;g.player.z=17;g.player.y=0;g.cameraYaw=0;g.velocity.set(0,0);}');button(2);check('X opens model catalogue',g.locator('.assetGrid').is_visible())
 for _ in range(25):
  if g.evaluate('document.activeElement.dataset.asset')=='barrel':break
  button(13)
 check('D-pad navigates actual catalogue thumbnails',g.evaluate('document.activeElement.dataset.asset')=='barrel');button(0);check('A selects model for placement',g.evaluate("adventure.game.pending?.asset==='barrel'"))
 before=g.evaluate('adventure.game.pending.yaw');button(5);check('right bumper rotates placement',g.evaluate('(n)=>adventure.game.pending.yaw>n',before));button(0);check('A confirms valid placed object',g.evaluate("adventure.game.data.objects.length===1&&!adventure.game.pending"))
 tick([1,0,0,0]);g.evaluate('window.injectedPad=null;adventure.game.controls.pollGamepad(.05)');check('disconnect immediately releases motion',g.evaluate('!adventure.game.controls.gamepad.connected&&adventure.game.controls.movement().x===0&&adventure.game.velocity.length()===0'))
 running=g.locator('#run').get_attribute('aria-pressed');g.locator('#run').tap();check('touch fallback remains usable after disconnect',g.locator('#run').get_attribute('aria-pressed')!=running)
 g.evaluate("Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>{throw Error('SecurityError')}});adventure.game.controls.pollGamepad(.05)");check('denied Gamepad API safely falls back',g.evaluate('!adventure.game.controls.gamepad.connected'))
 running=g.locator('#run').get_attribute('aria-pressed');g.locator('#run').focus();g.keyboard.press('Space');check('Space activates focused touch button exactly once',g.locator('#run').get_attribute('aria-pressed')!=running)
 running=g.locator('#run').get_attribute('aria-pressed');g.keyboard.press('Enter');check('Enter activates focused button without duplicate gameplay action',g.locator('#run').get_attribute('aria-pressed')!=running and not g.locator('#modal').is_visible())
 g.evaluate("Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.injectedPad]});window.dispatchEvent(new Event('gamepadconnected'));");tick([1,0,0,0],[0]);check('connection event gates already-held axes and A',g.evaluate('adventure.game.controls.movement().x===0&&!adventure.game.modalOpen'));tick();tick([1,0,0,0]);g.evaluate("{const e=new Event('gamepaddisconnected');Object.defineProperty(e,'gamepad',{value:{index:0}});window.injectedPad=null;window.dispatchEvent(e);}");check('disconnect event releases state before next frame',g.evaluate('!adventure.game.controls.gamepad.connected&&adventure.game.controls.movement().x===0'))
 check('gamepad integration has no runtime errors',not errors,errors);b.close()
(OUT/'gamepad-checks.json').write_text(json.dumps(result,indent=2)+'\n')
