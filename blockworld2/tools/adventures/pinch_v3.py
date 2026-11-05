"""Verify the remaining-finger gesture against preserved Preview 02 and current controls."""
import json,pathlib
from playwright.sync_api import sync_playwright
OUT=pathlib.Path(__file__).resolve().parents[2]/'docs/adventures-v3';rows=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for port in [5177,5175]:
  ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);g=ctx.new_page();g.set_default_timeout(120000);g.add_init_script("localStorage.setItem('blockworld-adventures-controls-v2',JSON.stringify({quality:'gentle',running:false}))");g.goto(f'http://127.0.0.1:{port}/adventures.html?test=1');g.wait_for_function('window.adventure?.ready');g.locator('#enter').click();g.evaluate("window.requestAnimationFrame=()=>0;window.touchTrace=[];for(const name of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])document.getElementById('view').addEventListener(name,e=>touchTrace.push({name,id:e.pointerId}));");cd=ctx.new_cdp_session(g)
  def touch(kind,pts):
   cd.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':pts});g.wait_for_timeout(70)
  touch('touchStart',[{'x':160,'y':380,'id':2}]);touch('touchStart',[{'x':160,'y':380,'id':2},{'x':250,'y':380,'id':3}]);touch('touchMove',[{'x':140,'y':380,'id':2},{'x':270,'y':380,'id':3}]);touch('touchEnd',[{'x':270,'y':380,'id':3}]);before=g.evaluate('adventure.game.cameraYaw');touch('touchMove',[{'x':175,'y':380,'id':2}]);after=g.evaluate('adventure.game.cameraYaw');row={'preview':'02'if port==5177 else'03','yawBefore':before,'yawAfter':after,'orbitContinues':abs(after-before)>.05,'events':g.evaluate('touchTrace')};rows.append(row);print(row,flush=True);ctx.close()
 b.close()
assert not rows[0]['orbitContinues'] and rows[1]['orbitContinues'],rows
(OUT/'pinch-reference.json').write_text(json.dumps({'checks':[{'name':'remaining-finger orbit reproduced on preserved controls and fixed in current build','passed':True}],'observations':rows,'fixtureCorrection':'The touchEnd point identifies the released contact. Initial probe moved that released contact; corrected probe moves the still-held contact, with pointer events retained.'},indent=2)+'\n')
