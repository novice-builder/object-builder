"""First-use quality, preserved choices and actual drawing-buffer cost on emulated inputs."""
import argparse,pathlib,json
from playwright.sync_api import sync_playwright
OUT=pathlib.Path(__file__).resolve().parents[2]/'docs/adventures-v8';(OUT/'screenshots').mkdir(parents=True,exist_ok=True);parser=argparse.ArgumentParser();parser.add_argument('--phase',choices=['before','after'],required=True);a=parser.parse_args();result={'phase':a.phase,'checks':[],'environment':'Managed Chromium ANGLE SwiftShader, pointer/viewport/DPR emulation. Drawing-buffer/shadow/submission counters only, not physical-device FPS.'}
def check(name,ok,detail=None):
 result['checks'].append({'name':name,'passed':bool(ok),'detail':detail});(OUT/f'startup-quality-{a.phase}.json').write_text(json.dumps(result,indent=2)+'\n');print('PASS'if ok else'REPRODUCED',name,detail or '',flush=True)
 if a.phase=='after':assert ok,name
cases=[('phone-new',390,844,True,None,'gentle'),('tablet-new',1024,768,True,None,'gentle'),('desktop-new',1024,768,False,None,'balanced'),('phone-explicit-balanced',390,844,True,'{"quality":"balanced","running":true}','balanced'),('phone-explicit-high',390,844,True,'{"quality":"high","running":false}','high'),('phone-denied-storage',390,844,True,'denied','gentle'),('phone-invalid-pref',390,844,True,'{"quality":"unknown","running":true}','gentle')]
with sync_playwright()as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for name,w,h,touch,stored,expected in cases:
  g=b.new_page(viewport={'width':w,'height':h},has_touch=touch,is_mobile=touch,device_scale_factor=3 if touch else 1);g.set_default_timeout(120000)
  if stored=='denied':g.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError')}})")
  elif stored:g.add_init_script('if(localStorage.getItem("blockworld-adventures-controls-v2")===null)localStorage.setItem("blockworld-adventures-controls-v2",'+json.dumps(stored)+')')
  g.goto('http://127.0.0.1:5175/adventures.html?test=1');g.wait_for_function('window.adventure?.ready');g.locator('#enter').click();g.evaluate('()=>{window.requestAnimationFrame=()=>0}');g.wait_for_timeout(100);g.evaluate('adventure.game.cameraUpdate(1/60);adventure.game.renderScene()');observed=g.evaluate('({quality:adventure.game.quality,coarse:matchMedia("(pointer:coarse)").matches,pixelRatio:adventure.game.renderer.getPixelRatio(),width:adventure.game.renderer.domElement.width,height:adventure.game.renderer.domElement.height,shadows:adventure.game.renderer.shadowMap.enabled,drawCalls:adventure.stats().drawCalls,triangles:adventure.stats().triangles,running:adventure.game.controls.running})');check(name+' selects a conservative default or retains explicit quality',observed['quality']==expected,observed)
  if name=='phone-new':g.evaluate('()=>{document.getElementById("toast").hidden=true;adventure.game.renderScene()}');g.screenshot(path=str(OUT/'screenshots'/f'phone-startup-{a.phase}.png'))
  if a.phase=='after'and name=='phone-explicit-balanced':
   g.locator('#menu').click();g.locator('#quality').select_option('high');g.reload();g.wait_for_function('window.adventure?.ready');check('explicit quality and run choice survive reload on a coarse pointer',g.evaluate('adventure.game.quality==="high"&&adventure.game.controls.running===true'))
  g.close()
 b.close()
